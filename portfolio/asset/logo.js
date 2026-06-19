import * as THREE from 'https://esm.sh/three@r128';
import { GLTFLoader } from 'https://esm.sh/three@r128/examples/jsm/loaders/GLTFLoader.js';


const canvas = document.querySelector('#logo-canvas');
const logo2d = document.querySelector('.logo-2d');


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

let renderer;

try{
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });

}catch(e){
    logo2d.classList.remove('hidden');
    canvas.classList.add('logo3d-hidden');
}


renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const light1 = new THREE.SpotLight(0xffffff, 100);
const light2 = new THREE.SpotLight(0xffffff, 100);
const al = new THREE.AmbientLight(0xffffff, 10);
light1.position.set(3, 3, 3);
light2.position.set(-3, -3, -4);
scene.add(light1);
scene.add(light2);
scene.add(al);

camera.position.z = 5;
let accelation = 0;

canvas.addEventListener('click', whenClicked);
document.addEventListener('wheel', whenWheelMove);

const loader = new GLTFLoader();
loader.load('../asset/hkLOGO.glb', (gltf) => {
    const model = gltf.scene;
    
    scene.add(model);

    let now = 0;
    let prev = null;
    let delta = null;
    function animate(timeStamp){
        
        now = timeStamp;
        delta = !prev ? 0 : (now - prev) * 0.001;
        requestAnimationFrame(animate);
        prev = now;
        scene.children.forEach( c => {
            if(c.rotation){
                c.rotation.y -= (Math.PI / 4 + accelation) * delta;
                c.rotation.x -= (Math.PI / 4 + accelation) * delta * 0.1;
            }
        })

        if(accelation > 0){
            accelation -= 0.1;
        }else{
            accelation = 0;
        }
        renderer.render(scene, camera);
    }
    animate();
});

function whenClicked(){
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();

    light1.color.setRGB(r, g, b);
    light2.color.setRGB(r, g, b);
    al.color.setRGB(r, g, b);
    accelation = 10;
}


function whenWheelMove(e){
    console.log(e);
    accelation = e.deltaY * 0.1;
}
