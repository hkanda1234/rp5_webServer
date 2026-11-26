export const statementAnimation = {
    container: null,
    elms: null,
    getElms: () => {
        const self = statementAnimation;
        self.elms = document.querySelectorAll('.statement-paragraph');
        self.elms.forEach((e) => {
           e.classList.add('hidden'); 
        });
        self.container = document.querySelector('.statement-container');

    },
    observer: new IntersectionObserver((entries) => {
        
        entries.forEach((e) => {
            
            if(document.readyState === "complete"){
                statementAnimation.anim();
                console.log(e);

            }
            
        })
    }),
    animDelays: [],
    animStart: (transitionDelays) => {
        const self = statementAnimation;
        self.getElms();
        self.observer.observe(self.container);
        self.animDelays = transitionDelays;
        let delay = 0;
        self.elms.forEach((e, index) => {
            delay += self.animDelays[index];
            e.style.transitionDelay = `${delay}s`;
            
        });

    },
    anim: () => {
        const self = statementAnimation;
        self.elms.forEach((e) => {
            e.classList.remove('hidden');
        })
    }


}