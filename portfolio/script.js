


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