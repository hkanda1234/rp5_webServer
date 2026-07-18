//reveal hidden-elements
const hiddenElements = document.querySelectorAll('.hidden');

const hiddenObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((e) => {
        if (e.isIntersecting) {
            e.target.classList.remove('hidden');
            observer.unobserve(e.target);
        }
    });
});

hiddenElements.forEach((e) => {
    hiddenObserver.observe(e);
});

//work-cards rotation
const workCardElements = document.querySelectorAll('.work-card');
workCardElements.forEach((card) => {

    card.addEventListener('transitionend', (e) => {
        card.classList.add('visible');
    })

    card.addEventListener('mouseover', (e) => {
        if(card.classList.contains('visible')){

            card.classList.add('prevent-default');
        }
    })

    card.addEventListener('mousemove', (e) => {

        if(!card.classList.contains('prevent-default') && card.classList.contains('visible')){
            card.classList.add('prevent-default');
        }

        const width = e.target.clientWidth;
        const height = e.target.clientHeight;
        const x = e.offsetX;
        const y = e.offsetY;
        const nx = x / (width - 1) * 2 - 1;
        const ny = y / (height - 1) * 2 - 1;
        card.style.transform = `rotateY(${nx * 5}deg) rotateX(${-ny * 5}deg)`;
        
    })

    card.addEventListener('mouseout', (e) => {
        card.classList.remove('prevent-default');
        card.style.transform = '';
    })
})