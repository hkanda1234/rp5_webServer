

const hiddens = document.querySelectorAll('.hidden');

const hiddenObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if(e.isIntersecting){
            e.target.classList.remove('hidden');
        }
    });
});

for(const hidden of hiddens){
    hiddenObserver.observe(hidden);
}

const demoWrap = document.querySelector('.demo');

if(demoWrap){
    observeDemoCarousel(demoWrap);
}

function observeDemoCarousel(demoWrap){
    const leftButton = demoWrap.querySelector('.carousel-button-left');
    const rightButton = demoWrap.querySelector('.carousel-button-right');
    const carousel = demoWrap.querySelector('.carousel');
    const cards = carousel.querySelectorAll('.carousel-card');

    carousel.addEventListener('scroll',() => {
        carousel.addEventListener('scrollend', () => {
            updateCarousel(demoWrap, getCarouselIndex(demoWrap));
        })
    })

    leftButton.addEventListener('click', ()=> {
        const index = getCarouselIndex(demoWrap);
        if(index > 0){
            carousel.scrollBy({
                left: -cards[index].clientWidth,
                behavior: 'smooth'
            });
            updateCarousel(demoWrap, index - 1);
        }
    })

    rightButton.addEventListener('click', ()=> {
        const index = getCarouselIndex(demoWrap);
        if(index < cards.length - 1){
            carousel.scrollBy({
                left: cards[index].clientWidth,
                behavior: 'smooth'
            });
            updateCarousel(demoWrap, index + 1);
        }
    })

    updateCarousel(demoWrap, getCarouselIndex(demoWrap));
}

function updateCarousel(demoWrap, index){
    const cards = demoWrap.querySelectorAll('.carousel-card');
    const leftArrow = demoWrap.querySelector('.carousel-button-left-arrow');
    const rightArrow = demoWrap.querySelector('.carousel-button-right-arrow');
    const indicators = demoWrap.querySelectorAll('.carousel-indicator');
    
    if(index <= 0){
        leftArrow.classList.add('inactive');
    }else{
        leftArrow.classList.remove('inactive');
    }

    if(index >= cards.length - 1){
        rightArrow.classList.add('inactive');
    }else{
        rightArrow.classList.remove('inactive');
    }

    cards.forEach((c, i) => {
        if(index == i){
            c.classList.remove('inactive');
            indicators[i].classList.add('active');
        }else{
            c.classList.add('inactive');
            indicators[i].classList.remove('active');
        }
    })


}

const footerEnd = document.querySelector('.end');
let prevWindowWidth = window.innerWidth;
justifyFooterEnd();
window.addEventListener('resize', () => {
    if(prevWindowWidth === window.innerWidth)return;
    justifyFooterEnd();
});


function getCarouselIndex(demoWrap){
    const carousel = demoWrap.querySelector('.carousel');
    const cards = carousel.querySelectorAll('.carousel-card');
    const demoRect = demoWrap.getBoundingClientRect();
    const center = demoRect.left + demoRect.width / 2;

    let near = Infinity;
    let nearest = null;

    cards.forEach((c, i) => {
        const rect = c.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const dist = Math.abs(cardCenter - center);
        if(dist <= near){
            nearest = i;
            near = dist;
        }
    });

    return nearest;

}

function justifyFooterEnd(){
    const el = footerEnd;
    const vpw = document.body.clientWidth;
    let celw = el.clientWidth;
    let size = 0;
    while(true){
        size++;
        el.style = `font-size: ${size}px`;
        celw = el.clientWidth;
        console.log(celw, vpw);
        if(celw >= vpw){
            el.style = `font-size: ${size - 1}px; line-height: ${size - 1}px`;
            break;
        }
    }

}

