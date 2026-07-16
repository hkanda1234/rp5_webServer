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
