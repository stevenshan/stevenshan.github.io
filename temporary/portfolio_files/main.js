// load the navbar component
async function loadNavbar(pageId) {
    $(function(){
        $("#nav-placeholder").load("./Asset/html/navbar.html");
    });
    // small imperceptible delay to allow the page to properly process the fact that the navbar has been added
    setTimeout(() => { setActivePage(pageId);}, 20);
}

// set the navbar active page
function setActivePage(pageId) {
    let activePage = document.getElementById(pageId);
    activePage.classList.add('active');
}

// load the animated header
function loadAnimatedHeader(){
    // Code downloaded from https://www.finisher.co/lab/header/
    new FinisherHeader({
        "count": 100,
        "size": {
          "min": 2,
          "max": 16,
          "pulse": 0.1
        },
        "speed": {
          "x": {
            "min": 0,
            "max": 0.4
          },
          "y": {
            "min": 0,
            "max": 0.6
          }
        },
        "colors": {
          "background": "#bbb5e9",
          "particles": [
            "#fbfcca",
            "#d7f3fe",
            "#ffc5fa"
          ]
        },
        "blending": "overlay",
        "opacity": {
          "center": 1,
          "edge": 0
        },
        "skew": 0,
        "shapes": [
          "c"
        ]
      });
}

function setHash(hash) {
    const id = hash.replace(/^.*#/, '');
    const elem = document.getElementById(id);
    elem.id = id + "-temp";
    window.location.hash = hash;
    elem.id = id;
}

$(function() {
    let scrollPos;
    $(".nav-link").click(function(e) {
        e.preventDefault();

        let anchor = $(this).attr("href");
        if (anchor) {
            document.querySelector(anchor).scrollIntoView({
              behavior: 'smooth'
            });
            setHash(anchor);
        }
    });

    let slides = [
        [$("#projects"), $("#projects-link")],
        [$("#play"), $("#play-link")],
        [$("#about"), $("#about-link")],
    ];

    $(window).scroll(function() {
        let offset = $(window).scrollTop() + $(window).height() / 2;
        for (let i = 0; i < slides.length; i++) {
            let slide_offset = slides[i][0].offset().top + slides[i][0].height();
            if (slide_offset > offset) {
                $(".nav-link").removeClass("active");
                slides[i][1].addClass("active");
                setHash(slides[i][0].selector);
                break;
            }
        }
    });
});
