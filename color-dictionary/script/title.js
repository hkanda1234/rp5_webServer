const overlay = document.querySelector(".overlay");
const titleElements = document.querySelectorAll(".title h1");
const navElement = document.querySelectorAll(".navigation h2");
const title_color = document.querySelector("#title-3");

overlay.addEventListener("click", () => {
    overlay.classList.add('overlay-hidden');
    titleElements.forEach(e => {
    e.classList.add('title-hidden');
});
});

titleElements.forEach(e => {
    e.classList.remove('title-hidden');
});

const colour_color = ["red", "green", "yellow", "blue", "purple", "white"];

setTimeout(() => {
    for(let i = 0; i < 6; i++){
        setTimeout(() => {
            title_color.style.color = colour_color[i];
        }, i * 200);
    }
}, 1500);


navElement.forEach(e => {
    e.classList.remove('title-hidden');
});