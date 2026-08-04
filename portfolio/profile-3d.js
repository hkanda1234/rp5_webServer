import * as THREE from 'https://esm.sh/three@r128';
import { GLTFLoader } from 'https://esm.sh/three@r128/examples/jsm/loaders/GLTFLoader.js';

const modelURI = "/portfolio/hkanda-head.glb";
const root_max_angle = {
    x: 20,
    y: 20
};

const head_max_angle = {
    x: 20,
    y: 25,
};

const eye_max_angle = {
    x: 20,
    y: 10,
}



const canvas = document.getElementById("profile-canvas");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, getCanvasAspect(), 0.1, 100);
camera.position.set(0, 0, 1.5)
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.castShadow = true;
const al = new THREE.AmbientLight(new THREE.Color(1, 0.8, 0.7), 1);
scene.add(sun);
scene.add(al);



let renderer;
try{
    renderer = new THREE.WebGLRenderer({canvas : canvas, antialias: true, alpha: true});
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
} catch(e){
    throw new Error(e);
    alert(e);
}

renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const loader = new GLTFLoader();

let model = null;
let headMesh = null;
let shoulder = null;
let head = null;
let leftEye = null;
let rightEye = null;

loader.load(modelURI, (gltf) => {
    model = gltf.scene;
    scene.add(model);
    model.traverse((obj) => {
        if(obj.name == "Head") headMesh = obj;
        if(obj.name == "bone_root") shoulder = obj;
        if(obj.name == "bone_head") head = obj;
        if(obj.name == "eye_left") leftEye = obj;
        if(obj.name == "eye_right") rightEye = obj;
    });
    console.log(shoulder, head);
    shoulder.position.y = -0.5;
    animate();
});



const profileSection = document.getElementById('profile');
profileSection.addEventListener("mousemove", screenToNDC);

let rot = 0;
let ndc = null;
let world = null;

function animate(){
    //rot -= 0.01;
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function eyesLookAt(){
    leftEye.parent.updateMatrixWorld();
    leftEye.lookAt(world);
    leftEye.rotateX(Math.PI / 2.3);
    rightEye.lookAt(world);
    rightEye.rotateX(Math.PI / 2);
}

function screenToNDC(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1; // Y反転注意
  ndc = {x: x, y: y};
  ndcToWorld(ndc, camera, 0.5);
  
  shoulder.rotation.y = ndc.x / 20;
  shoulder.rotation.x = - ndc.y / 15;
  head.rotation.y = ndc.x / 10;
  head.rotation.x = - ndc.y / 8;
  
  //eyesLookAt();
}

function ndcToWorld(ndc, camera, z) {
  const vector = new THREE.Vector3(ndc.x, ndc.y, z);
  vector.unproject(camera);
  world = vector;
}



function getCanvasAspect(){
    return canvas.clientWidth / canvas.clientHeight;
}