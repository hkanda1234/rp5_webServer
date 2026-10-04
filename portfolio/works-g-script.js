
import { cursor } from "./cursor.js";




const appearanceAnimator = {
    hiddens: document.querySelectorAll('.hidden'),
    observer: new IntersectionObserver((entries, observer) => {
        entries.forEach((e) => {
            if(e.isIntersecting && e.target.classList.contains('hidden')){
                e.target.classList.remove('hidden');
                observer.unobserve(e.target);
            }
        })
    }),
    start: function(){
        this.hiddens.forEach((e) => {
            this.observer.observe(e);
        });
    }

}

function startImageModalInteraction(){
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

}

function adjustTitleToHeaderBottom(){
    const title = document.querySelector('.title-wrap');
    const header = document.querySelector('header');
    const hh = header.clientHeight;
    title.style.marginTop = `${hh}px`;
}

function startCursor(){
    
    const body = document.querySelector('body');
    const cursorFollower = document.querySelector('.cursor-follower');
    
    const cursorSVGElement = document.getElementById('cursor-follower-svg');
    
    const hoverTargets = [];
    [...document.querySelectorAll('img.openable')]?.forEach((e) => {
        hoverTargets.push(e);
    });
    
    
    hoverTargets.push(document.querySelector('div.back-to-top-button'));
    hoverTargets.push(document.querySelector('.image-modal-close-button'));
    
    const links = document.querySelectorAll('a');
    [...links].forEach((e) => {
        hoverTargets.push(e);
    });
    
    
    const _cursor = cursor.create(cursorSVGElement, cursorFollower);
    _cursor.start(hoverTargets);

}

const Loading = {
    
    dom: false,
    load: false,
    fonts: false,

    lodingScreen: document.getElementById('loading-screen'),
    log: document.getElementById('loading-status'),
    main: document.querySelector('main'),

    setMainDisplayNone: function(){
        this.main.style.display = 'none';
    },

    setMainDisplayBlock: function(){
        this.main.style.display = '';
    },

    setLoadingScreenDisplayNone: function(){
        this.lodingScreen.style.display = 'none';
    },

    setEvents: function(){

        this.setMainDisplayNone();
        document.addEventListener('DOMContentLoaded', () => {
            console.log(document.readyState);
            this.dom = true;
            this.checkStatus();
            this.addLog('DOM load done.')
        })
        window.addEventListener('load', (e) => {
            console.log(document.readyState);
            this.load = true
            this.checkStatus();
            this.addLog('ready state compreted.')
        })
        document.fonts.ready.then(() => {
            console.log('fonts done');
            this.fonts = true;
            this.checkStatus();
            this.addLog('fonts ready.')
        })
    },

    addLog(t){
        this.log.innerHTML = `${this.log.innerHTML}${t}<br>`;
    },

    checkStatus: function(){
        if(this.dom && this.load && this.fonts){
            this.onDone();
        }
    },

    onDone: function(){
        appearanceAnimator.start();
        adjustTitleToHeaderBottom();
        startCursor();
        startImageModalInteraction();
        this.setMainDisplayBlock();
        this.setLoadingScreenDisplayNone();
    }
}

Loading.setEvents();
