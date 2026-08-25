import * as THREE from 'https://esm.sh/three@r128';
import { GLTFLoader } from 'https://esm.sh/three@r128/examples/jsm/loaders/GLTFLoader.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/dist/lil-gui.esm.min.js';


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

let model = null;
let headMesh = null;
let hairMesh = null;
let eyeMesh = {
    l: null,
    r: null
}
let glassesMesh = null;

const meshesShadowConfig = [
    {name: "Head", castShadow : true, receiveShadow : true},
    {name: "hair", castShadow : true, receiveShadow : false},
    {name: "EyeL", castShadow : false, receiveShadow : true},
    {name: "EyeR", castShadow : false, receiveShadow : true},
    {name: "Glasses", castShadow : true, receiveShadow : false},
];

let shoulder = null;
let head = null;
let leftEye = null;
let rightEye = null;


const canvas = document.getElementById("profile-canvas");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, getCanvasAspect(), 0.1, 100);
camera.position.set(0, 0, 1.5);
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(0, 0.4, 1);
sun.target.position.set(0, 0, 0);
scene.add(sun.target);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.8;
sun.shadow.camera.far = 1.5;
sun.shadow.camera.left = -0.4;
sun.shadow.camera.right = 0.4;
sun.shadow.camera.top = -0.4;
sun.shadow.camera.bottom = 0.4;
sun.shadow.bias = -0.005;
sun.shadow.normalBias = 0;
sun.shadow.camera.updateProjectionMatrix();



const al = new THREE.AmbientLight(new THREE.Color(1, 0.8, 0.7), 0.5);
scene.add(sun);
scene.add(al);

canvas.addEventListener("resize", () => {
    camera.aspect = getCanvasAspect();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    console.log('resize');
});


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
let mixer = null;
const actions = {};
const timer = new THREE.Timer();

loader.load(modelURI, (gltf) => {
    model = gltf.scene;
    scene.add(model);
    model.traverse((obj) => {
        switch(obj.name){
            case "Head" :
                headMesh = obj
                break;
            case "Glasses" :
                glassesMesh = obj
                break;
            case "hair1" : 
                hairMesh = obj;
                break;
            case "EyeL" :
                eyeMesh.l = obj;
                break;
            case "EyeR" :
                eyeMesh.r = obj;
                break;
            case "bone_root" :
                shoulder = obj;
                break;
            case "bone_head" :
                head = obj;
                break;
            case "eye_left" :
                leftEye = obj;
                break;
            case "eye_right" :
                rightEye = obj;
                break;
        }
    });
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    eyeMesh.l.receiveShadow = true;
    eyeMesh.r.receiveShadow = true;
    console.log(hairMesh, eyeMesh);
    hairMesh.castShadow = true;
    hairMesh.material.alphaTest = 0.55;
    shoulder.position.y = -0.4;

    mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => {
        actions[clip.name] = mixer.clipAction(clip);
        actions[clip.name].setLoop(THREE.LoopOnce);
    });

    console.log(actions);
    
    animate();
});





const leftEyeFront = new THREE.Vector3(-0.07, 1, 0).normalize();
const rightEyeFront = new THREE.Vector3(0.05, 1, 0).normalize();
sun.rotateX(0);


const profileSection = document.getElementById('profile');
profileSection.addEventListener("mousemove", screenToNDC);

let ndc = null;
let world = null;
let humid = 0;

function animate(){
    requestAnimationFrame(animate);
    timer.update();
    const delta = timer.getDelta();
    updateHumid(delta);
    mixer.update(delta);
    renderer.render(scene, camera);

}

function updateHumid(delta){
    humid -= delta;
    if(humid <= 0){
        playBlink();
        humid = Math.random() * 5;
    }
}

function playBlink(){
    actions["blink"].reset().play();
}

function worldLookAt(bone, parent, forward = new THREE.Vector3(0, 0, -1)){
    parent.updateMatrixWorld(true);
    const worldPos = bone.getWorldPosition(new THREE.Vector3());
    const direction = world.clone().sub(worldPos).normalize();
    const worldQuat = new THREE.Quaternion().setFromUnitVectors(forward, direction);
    const parentWorldQuat = parent.getWorldQuaternion(new THREE.Quaternion());
    const localQuat = parentWorldQuat.clone().invert().multiply(worldQuat);
    bone.quaternion.copy(localQuat);
}

function screenToNDC(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  ndc = {x: x, y: y};
  ndcToWorld(ndc, camera, 1);
  
  shoulder.rotation.y = ndc.x / 5;
  shoulder.rotation.x = - ndc.y / 5;
  head.rotation.y = ndc.x / 5;
  head.rotation.x = - ndc.y / 4;
  
  worldLookAt(leftEye, head, leftEyeFront);
  worldLookAt(rightEye, head, rightEyeFront);

}

function ndcToWorld(ndc, camera, z) {
  const vector = new THREE.Vector3(ndc.x, ndc.y, camera.near);
  vector.unproject(camera);
  vector.x *= 12;
  vector.y *= 9;
  vector.z = z;
  world = vector;
}



function getCanvasAspect(){
    return canvas.clientWidth / canvas.clientHeight;
}