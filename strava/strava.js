const PAGE_SIZE = 20

const stravaAuthUrl = (clientId) => {
    const url = new URL(window.location.href)
    const searchParams = new URLSearchParams(window.location.search)
    const urlDest = `${url.origin}${url.pathname}?stravaClient=${encodeURIComponent(searchParams.get("stravaClient"))}`
    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(urlDest)}&approval_prompt=force&scope=activity:write,activity:read`
}

function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function setCookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

class Strava {
    constructor(clientId, clientSecret) {
        this.clientId = clientId
        this.clientSecret = clientSecret

		const stravaAuth = getCookie("stravaAuth")
        this.token = null
        try {
            if (stravaAuth != "") {
                this.token = JSON.parse(stravaAuth)
            }
        } catch {}

        this.waitAuth = null

        this.auth()
    }

    setAuth(authPromise) {
        return authPromise
            .then(response => {
                if (response.status != 200) {
                    throw response
                }
                return response.json()
            })
            .then(response => {
                this.token = {
                    expires: response.expires_at * 1000,
                    refresh: response.refresh_token,
                    access: response.access_token,
                }
                setCookie("stravaAuth", JSON.stringify(this.token))
                this.waitAuth = null
            })
            .catch((error) => {
                this.token = null
                this.waitAuth = null
                console.log("Auth failed - retrying", error)
                return this.auth(true)
            })
    }

    auth(forceReauth) {
        if (this.waitAuth != null) {
            return this.waitAuth
        }

        if (this.token != null && this.token.expires != null) {
            if (new Date(this.token.expires) <= new Date()) {
                this.waitAuth = this.refreshAuth()
                return this.waitAuth
            } else {
                return Promise.resolve(null)
            }
        }

        const authCode = new URLSearchParams(window.location.search).get("code")
        if (authCode == null || forceReauth) {
            window.location.href = stravaAuthUrl(this.clientId)
            return new Promise(() => {})
        }

        const formdata = new FormData()
        formdata.append("code", authCode)
        formdata.append("client_id", this.clientId)
        formdata.append("client_secret", this.clientSecret)
        formdata.append("grant_type", "authorization_code")

        const requestOptions = {
            method: "POST",
            body: formdata,
            redirect: "follow"
        }

        this.waitAuth = this.setAuth(fetch("https://www.strava.com/oauth/token", requestOptions))

        return this.waitAuth
    }

    refreshAuth() {
        const formdata = new FormData()
        formdata.append("refresh_token", this.token.refresh)
        formdata.append("client_id", this.clientId)
        formdata.append("client_secret", this.clientSecret)
        formdata.append("grant_type", "refresh_token")

        const requestOptions = {
            method: "POST",
            body: formdata,
            redirect: "follow"
        }

        return this.setAuth(fetch("https://www.strava.com/oauth/token", requestOptions))
    }

    listActivities(pageNumber) {
        return this.auth().then(() => {
            const headers = new Headers()
            headers.append("Authorization", `Bearer ${this.token.access}`)

            const requestOptions = {
                method: "GET",
                headers: headers,
                redirect: "follow"
            }

            const url = `https://www.strava.com/api/v3/athlete/activities?page=${pageNumber}&per_page=${PAGE_SIZE}`

            return fetch(url, requestOptions)
                .then((response) => response.json())
                .catch((error) => console.error(error))
        })
    }

    updateActivity(activity) {
        return this.auth().then(() => {
            const headers = new Headers()
            headers.append("Authorization", `Bearer ${this.token.access}`)

            const requestOptions = {
                method: "PUT",
                headers: headers,
                redirect: "follow"
            }

            const url = `https://www.strava.com/api/v3/activities/${activity.id}?` +
                [
                    `name=${encodeURIComponent(activity.name)}`,
                    `commute=${encodeURIComponent(activity.commute)}`,
                    `hide_from_home=${encodeURIComponent(activity.commute)}`,
                ].join("&")

            return fetch(url, requestOptions)
                .then((response) => response.json())
                .catch((error) => console.error(error))
        })
    }
}

