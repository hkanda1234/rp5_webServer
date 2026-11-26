export const commonFadeInAnimation = {
    flaggedElms: document.querySelectorAll('fadein'),
    observer: new IntersectionObserver((entries) => {
        
    }),
    start: () => {
        commonFadeInAnimation.observer.observe();
    }
} 