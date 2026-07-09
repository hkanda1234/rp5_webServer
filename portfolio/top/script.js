

window.addEventListener('load', ()=>{
    initObserver();
})

function initObserver(){

const title1 = document.querySelector('#title-1');
const title2 = document.querySelector('#title-2');

setTimeout(() => {
    title1.classList.remove('title-1-hidden');
    title2.classList.remove('title-2-hidden');
}, 100);



const statement = document.querySelector('.statement');
const statementsfObserveOption = {
    threshold: 0.5
};

const statementsObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if(e.isIntersecting){
            const children = e.target.children;
            const l = children.length;
            for(let i = 0; i < l; i++){
                children[i].classList.remove('statement-hidden');
            }
        }
    });
}, statementsfObserveOption);

statementsObserver.observe(statement);

const worksObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if(e.isIntersecting){
            

            if(e.target.classList.contains('hidden')){
                e.target.classList.add('is-revealing');
            }

            e.target.classList.remove('hidden');
            
            e.target.addEventListener('transitionend', () => {
                e.target.classList.add('visible');
                e.target.classList.remove('is-revealing');
            });
                
            
        }
    });
},{ threshold: 0.1 });

const leftHiddenObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if(e.isIntersecting){
            e.target.classList.remove('left-hidden');
        }
    });
});

const HiddenObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if(e.isIntersecting){
            e.target.classList.remove('hidden');
        }
    });
});

const worksSection = document.querySelector('#works-section');
const worksFeaturedSection = document.querySelector('#works-featured-section');

leftHiddenObserver.observe(worksSection);
leftHiddenObserver.observe(worksFeaturedSection);

const works = document.querySelectorAll('.work');
for(const w of works){
    worksObserver.observe(w)
}

const hiddens = document.querySelectorAll('.hidden');

hiddens.forEach((e) => {
    console.log(e);
    if(e.classList.contains('hidden')){
        HiddenObserver.observe(e);
    }
})

}