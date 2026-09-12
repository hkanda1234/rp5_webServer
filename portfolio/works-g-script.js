
import { superEllipse } from "./superEllipse.js";

const header = document.querySelector('header');
const title = document.querySelector('.title-wrap');

document.addEventListener('DOMContentLoaded', () => {

    title.style.cssText = `translate: 0 ${header.clientHeight}px`;
})



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
        if(size > 1000)break;
        el.style = `font-size: ${size}px`;
        celw = el.clientWidth;
        if(celw >= vpw){
            el.style = `font-size: ${size - 1}px; line-height: ${size - 1}px`;
            break;
        }
    }

}

//image-modal;

const imageElements = document.querySelectorAll('img.openable');
const imageModal = document.querySelector('.image-modal');
const view = document.querySelector('.image-modal-view');

imageElements.forEach((element) => {
    if(element.classList.contains('image-modal-view')) return;

    
        
    element.addEventListener('click', (e) => {
        
        const src = element.src;
        view.src = src;
        imageModal.classList.remove('image-modal-hidden');
    })

    
        
})

imageModal.addEventListener('click', (e) => {
    if(e.target.classList.contains('image-modal-view')) return;
    imageModal.classList.add('image-modal-hidden');
});



const loop = {
    
    create: () => {
        
        const l = {
            frame: null,
            last: null,
            delta: null,
            startTime: null,
            animId: null,
        
            start: (frame) => {
                l.last = performance.now();
                l.startTime = performance.now();
                l.frame = frame;
                l.anim();
            },
        
            stop: () => {
                cancelAnimationFrame(l.animId);
                l.frame = null;
                l.last = null;
                l.delta = null;
                l.startTime = null;
                l.animId = null;
            },
        
            anim: (timestamp) => {
                l.animId = requestAnimationFrame(l.anim);
                if(!timestamp) return;
                l.delta = timestamp - l.last;
                l.last = timestamp;
                l.frame((timestamp - l.startTime) / 1000, l.delta / 1000);
            },
        }

        return l;
    }

}

const cursor = {
    speedMax: 500,
    cursorMoveDuration: 0.1,

    last: {
        x: 0,
        y: 0,
    },

    target: {
        x: null,
        y: null,
    },

    current: {
        x: null,
        y: null,
    },

    isInFocus: false,

    cursorWrapper: null,
    cursorSVGElement: null,
    cursorSVG: null,
    
    defaultWidth: 50,
    defaultK: 2,
    defaultR: {x: 1, y: 1},
    segment: 50,
    strokeWidth: 1,
    stroke: 'white',
    fill: 'transparent',
    
    r: null,
    k: null,

    loop: loop.create(),

    hoverTargets: null,

    hoverK: 10,
    hoverMultiplier: 1.2,
    hoverMargin: 50,
    hoverMoveDuration: 1,


    start: (wrapper, svgElement, hoverTargets) => {
        cursor.cursorWrapper = wrapper;
        cursor.cursorSVGElement = svgElement;
        cursor.cursorSVG = superEllipse.create(cursor.cursorSVGElement, cursor.defaultR, cursor.defaultK, cursor.segment, cursor.strokeWidth, cursor.stroke, cursor.fill);
        body.addEventListener('mousemove', (e) => {
            cursor.updateAttributes(e);
            cursor.move();
        });
        
        hoverTargets.forEach((e) => {
            console.log(e);
            e.addEventListener('mouseenter', cursor.mouseEnter);
            e.addEventListener('mouseout', cursor.mouseOut);
        })
    },

    mouseEnter: (event) => {
        const w = event.target.clientWidth;
        const h = event.target.clientHeight;
        const r = w / h;
        cursor.cursorSVG.changeWH({w: w + cursor.hoverMargin, h: h + cursor.hoverMargin}, 0.3);
        cursor.cursorSVG.changeK(cursor.hoverK, 0.5);
        cursor.isInFocus = true;
    },

    mouseOut: (event) => {
        cursor.cursorSVG.changeWH({w: cursor.defaultWidth, h: cursor.defaultWidth}, 0.2);
        
        cursor.cursorSVG.changeK(cursor.defaultK, 0.2);
        cursor.isInFocus = false;
    },

    updateAttributes: (event) => {
        const t = event.target;
        if(cursor.isInFocus){
            
            const box = t.getBoundingClientRect();
            const x = box.x + box.width / 2;
            const y = box.y + box.height / 2;
            cursor.target.x = x + event.movementX;
            cursor.target.y = y + event.movementY;

        }else{
            
            cursor.target.x = event.clientX;
            cursor.target.y = event.clientY;

        }
    },

    move: () => {
        const c = cursor;
        if(c.loop.animId){
            c.loop.stop();
            
        }
        c.loop.start(c.moveFrame);
    },

    moveFrame: (time, delta) => {
        const c = cursor;
        const ease = c.easeOut(time);
        
        const d = {
            x: c.target.x - c.last.x,
            y: c.target.y - c.last.y
        }

        
        
        const x = cursor.last.x + d.x * ease;
        const y = cursor.last.y + d.y * ease;
        
        let r = Math.sqrt(d.x * d.x + d.y * d.y) / c.speedMax;
        if(r > 1) r = 1;
        r = 1 - r;
        if(r < 0.1) r = 0.1;

        c.cursorSVG.r = {x: r, y: r};
        c.cursorSVG.update();
        
        c.last.x = x;
        c.last.y = y;

        const w = c.cursorSVG.width;

        if(c.isInFocus && time > c.hoverMoveDuration){
            c.cursorWrapper.style.translate = `${x}px ${y}px`;
            console.log('hover');
            c.loop.stop();
        } else if(!c.isInFocus && time > c.cursorMoveDuration){
            c.cursorWrapper.style.translate = `${x}px ${y}px`;

            c.loop.stop();
        }else if(time > 0){
            c.cursorWrapper.style.translate = `${x}px ${y}px`;

        }

    },


    easeOut: (time) => {
        const cm = cursor;
        let t = time / cm.cursorMoveDuration;
        if(cursor.isInFocus){
            t = time / cm.hoverMoveDuration;
        }
        return - Math.pow(t - 1, 2) + 1;
    },

    easeIn: (time) => {
        return Math.pow(time / cursor.cursorMoveDuration, 2);
    },

    delta: () => {
        const cm = cursor;
        return {
            x: cm.current.x - cm.last.x,
            y: cm.current.y - cm.last.y
        }
    },

    deltaDist: () => {
        const cm = cursor;          
        const d = cm.delta();
        return Math.sqrt(d.x * d.x + d.y * d.y);
        
    }
}

const body = document.querySelector('body');
const cursorFollower = document.querySelector('.cursor-follower');

const cursorSVGElement = document.getElementById('cursor-follower-svg');

const hoverTargets = [];
[...document.querySelectorAll('img.openable')].forEach((e) => {
    hoverTargets.push(e);
});

hoverTargets.push(document.querySelector('div.back-to-top-button'));

cursor.start(cursorFollower, cursorSVGElement, hoverTargets);