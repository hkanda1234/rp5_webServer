import { vec2, vec3, vec4, mat4, quat } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

import * as e from './engine.js';
import * as cpShader from './colorpickerShader.js';

const backgroundColor = vec4.fromValues(1, 1, 1, 0);

const canvasElement = document.querySelector("#colorPickerCanvas");

//scene setup
const glCanvas = new e.GLCanvas(canvasElement);
const gl = glCanvas.gl;
const scene = new e.Scene(gl);
const camera = new e.Camera(canvasElement);


glCanvas.scene = scene;
scene.camera = camera;

let homeCameraPosition = [0, 0, 10];

camera.transform.setPosition(...homeCameraPosition);

glCanvas.startRender();
//colorpicker setup



const cubeMesh = e.Mesh.createCube(gl, 1);
const cubeMainMaterial = e.Material.createFromSource(gl, cpShader.source);
cubeMainMaterial.addVec4Uniform("uMinColor", vec4.create());
cubeMainMaterial.addVec4Uniform("uMaxColor", vec4.create());

const colorPickerDivision = 4;
const colorPickerArrayNum = Math.pow(256, 1 / colorPickerDivision);
const colorPickerCubeInterval = 1;
const colorPickerExpandAnimDuration = 1;

let currColorPickerIndex = 0;


const colorPicker = createColorPicker(scene);
setColorToColorPicker(colorPicker[0], [0, 0, 0], [255, 255, 255]);
scene.add(colorPicker[0].origin);
startDivideCubeAnimation(colorPicker[0], colorPickerCubeInterval, colorPickerExpandAnimDuration);

let angularVelocity = 0;
let angularVelocityAxis = quat.create();
let originQuatDelta = quat.create();
let originQuat = quat.create();
const angularVelocityDeclineSpeed = 10;
//ux setup
let isColorPickerAnimating = true;
let wheelMoveMultipier = 0.05;
let mouseMoveMultipier = 0.005;
let mouseMoveThreshold = 10;
let pinchMoveMultiplier = 10;

let nearCubeThreshold = 5;
const nearCubeScaleDuration = 0.15;
const nearCubeScale = vec3.fromValues(0, 0, 0);
let prevNearCubes = [];
let currNearCubes = [];

canvasElement.addEventListener('touchstart', whenTouchStart);
canvasElement.addEventListener('touchmove', whenTouchMove);
canvasElement.addEventListener('touchend', whenTouchEnd);
canvasElement.addEventListener('wheel', whenWheelMove);
canvasElement.addEventListener('click', whenClicked);
canvasElement.addEventListener('mousedown', whenMouseDown);
canvasElement.addEventListener('mousemove', whenMouseMove);
document.addEventListener('mouseup', whenMouseUp);

//app start

startInitialColorPickerAnimation();


const app = startLoop((time, deltaTime, stop) =>{
    if(glCanvas.isTouchMoving){
        if(!glCanvas.prevTouchPos){
            glCanvas.prevTouchPos = glCanvas.currTouchPos;
        }
        rotateOrigin_touch(deltaTime);
    } else if(glCanvas.isMouseMoving){
        rotateOrigin_mouse(deltaTime);
    }
    else if(angularVelocity >= 0){
        inertiaRotateorigin(deltaTime);
    }

    
    if(glCanvas.isMultiTouching){
        if(!glCanvas.prevMultiTouchDist){
            glCanvas.prevMultiTouchDist = glCanvas.currMultiTouchDist;
        }
        zoomToOrigin(deltaTime);
    }
    hideNearCubes();
    glCanvas.prevMultiTouchDist = glCanvas.currMultiTouchDist;
    glCanvas.prevTouchPos = glCanvas.currTouchPos;
});

function startInitialColorPickerAnimation(){
    const origin = colorPicker[0].origin;
    const anim = startLoop((time, deltatime, stop) => {
        
        origin.transform.setEulerRotation(time * 20, time * 10, 0);
        originQuat = quat.clone(origin.transform.rotation);
        
        if(!isColorPickerAnimating){
            stop();
        }
    });
    
}

function finalResult(cube){

    const color = cube.min;
    const r = color[0];
    const g = color[1];
    const b = color[2];

    const hex = rgbToHex(color);

    let json = null;
    const generation = fetch(`https://hkanda.xyz/colorAnalyze?hex=${hex}&rgb=${r},${g},${b}`)
    .then(res => {
        res.json()
        .then(data =>{
            json = data;
        })
        
    });

    const animation = startLoop((time, deltatime, stop) => {
        cube.object.transform.setEulerRotation(time * 180, time * 180, 0);
        if(json != null){
            stop();
            showResult(json);
        }
    });
}

function showResult(json){
    const things = json.things;
    const best = json.bestMatching;
    console.log(things, best);
}

function to16(n){
    const h = n.toString(16).toUpperCase();
    return h.length < 2 ? `0${h}` : h;
}

function rgbToHex(rgb){
    const r = to16(rgb[0]);
    const g = to16(rgb[1]);
    const b = to16(rgb[2]);
    return `${r}${g}${b}`;
}

function hideNearCubes(){
    const near = findNearObjects();

    currNearCubes = [];
    for(const n of near){
        currNearCubes.push(n.id);
    }

    for(const c of currNearCubes){
        const included = prevNearCubes.includes(c);
        if(!included){
            prevNearCubes.push(c);
            const cube = near.find(o => o.id === c);
            startObjectScaleAnim(cube, nearCubeScale, nearCubeScaleDuration);
            cube.collider.scale = 0;
        }
    }

    if(prevNearCubes.length > 0){
        for(let i = 0; i < prevNearCubes.length; i++){
            const included = currNearCubes.includes(prevNearCubes[i]);
            if(!included){
                for(const cp of colorPicker){
                    const objects = cp.origin.children;
                    const cube = objects.find(o => o.id == prevNearCubes[i]);
                    if(cube){
                        
                        startObjectScaleAnim(cube, vec3.fromValues(1, 1, 1), nearCubeScaleDuration);
                        cube.collider.scale = 1;
                        prevNearCubes.splice(i, 1);
                    }
                    
                }
            }
        }
    }
}

function findNearObjects(){

    const near = [];

    for(const cp of colorPicker){
        cp.origin.children.forEach( (c) => {
            if(c.mesh && c.material){
                const wmat = c.transform.worldMatrix;
                const wpos = vec3.fromValues(wmat[12], wmat[13], wmat[14]);
                const cpos = camera.transform.position;

                const dist = vec3.dist(cpos, wpos);
                if(dist < nearCubeThreshold){
                    near.push(c);
                }
            }
        });
    }
    
    return near;
}


function startObjectRotationAnim(object, target, duration){
    const s = quat.clone(object.transform.rotation);

    const anim = startLoop((time, deltatime, stop) => {
        const t = time / duration;
        const ease = t * (2 - t);
        const rot = quat.create();
        quat.lerp(rot, s, target, ease);

        object.transform.setRotation(rot);
        if(t >= 1){
            object.transform.setRotation(...target);
            stop();
        }
        
    });
}

function startObjectScaleAnim(object, target, duration){
    const s = vec3.clone(object.transform.scale);
    
    const anim = startLoop((time, deltaTime, stop) => {
        const t = time / duration;
        const ease = t * (2 - t);
        const scale = vec3.create();
        vec3.lerp(scale, s, target, ease);
        object.transform.setScale(...scale);

        if(t >= 1){
            object.transform.setScale(...target);
            stop();
        }
    });

    

}

function zoomToOrigin(deltaTime){
    const dist = glCanvas.currMultiTouchDist - glCanvas.prevMultiTouchDist;
    const p = camera.transform.position;
    p[2] -= dist * pinchMoveMultiplier;
}

function inertiaRotateorigin(deltaTime){
    
    quat.setAxisAngle(originQuatDelta, angularVelocityAxis, angularVelocity * deltaTime);
    quat.multiply(originQuat, originQuatDelta, originQuat);
    
    colorPicker[0].origin.transform.setRotation(...originQuat);
    angularVelocity -= angularVelocityDeclineSpeed * deltaTime;
}

//function definition
function rotateOrigin_touch(dt){
    const p = glCanvas.prevTouchPos;
    const c = glCanvas.currTouchPos;
    const a = glCanvas.scene.camera.aspect;
    const delta = vec4.fromValues(c[0] - p[0], c[1] - p[1], 0, 0);
    const delta2d = vec2.fromValues(delta[0] * a, delta[1]);

    const z90 = mat4.create();
    mat4.rotateZ(z90, z90, Math.PI / 2);

    const NDCaxis = vec4.create();
    vec4.transformMat4(NDCaxis, delta, z90);
    //convert to world space

    const vp = camera.projectionMatrix;
    const ivp = mat4.create();
    mat4.invert(ivp, vp);
    const wAxis4 = vec4.create();
    
    vec4.transformMat4(wAxis4, NDCaxis, ivp);
        
    angularVelocityAxis = vec3.fromValues(wAxis4[0], wAxis4[1], wAxis4[2]);
    vec3.normalize(angularVelocityAxis, angularVelocityAxis);
    //create Quaternion
    const angle = vec2.dist(vec2.fromValues(0, 0), delta2d);
    quat.setAxisAngle(originQuatDelta, angularVelocityAxis, angle);
    angularVelocity = angle / dt;

    if(angle > 0){  
        quat.multiply(originQuat, originQuatDelta, originQuat);
        quat.normalize(originQuat, originQuat);
        
        colorPicker[0].origin.transform.setRotation(...originQuat);
        
    }
}

function rotateOrigin_mouse(dt){
    
    const mx = glCanvas.MouseMove.x * mouseMoveMultipier;
    const my = -glCanvas.MouseMove.y * mouseMoveMultipier;
    const delta = vec4.fromValues(mx, my, 0, 0);
    
    const delta2d = vec2.fromValues(mx, my);

    const z90 = mat4.create();
    mat4.rotateZ(z90, z90, Math.PI / 2);

    const NDCaxis = vec4.create();
    vec4.transformMat4(NDCaxis, delta, z90);
    //convert to world space
    console.log(NDCaxis);
    const vp = camera.projectionMatrix;
    const ivp = mat4.create();
    mat4.invert(ivp, vp);
    const wAxis4 = vec4.create();
    
    vec4.transformMat4(wAxis4, NDCaxis, ivp);
        
    angularVelocityAxis = vec3.fromValues(wAxis4[0], wAxis4[1], wAxis4[2]);
    vec3.normalize(angularVelocityAxis, angularVelocityAxis);
    //create Quaternion
    const angle = vec2.dist(vec2.fromValues(0, 0), delta2d);
    quat.setAxisAngle(originQuatDelta, angularVelocityAxis, angle);
    angularVelocity = angle / dt;

    if(angle > 0){  
        quat.multiply(originQuat, originQuatDelta, originQuat);
        quat.normalize(originQuat, originQuat);
        
        colorPicker[0].origin.transform.setRotation(...originQuat);
        
    }
}

function whenMouseDown(event){
    glCanvas.MouseMoveDist = 0;
    glCanvas.isMouseMoving = true;
    console.log(glCanvas.MouseMoveDist);
    if(isColorPickerAnimating){
        isColorPickerAnimating = false;
    }
}

function whenMouseMove(event){
    glCanvas.MouseMove.x = event.movementX;
    glCanvas.MouseMove.y = event.movementY;
    glCanvas.MouseMoveDist += vec2.dist(vec2.create(), vec2.fromValues(glCanvas.MouseMove.x, glCanvas.MouseMove.y));
    console.log(glCanvas.MouseMoveDist);
}

function whenMouseUp(event){
    glCanvas.isMouseMoving = false;
}

function whenClicked(event){
    console.log(glCanvas.MouseMoveDist, mouseMoveThreshold, glCanvas.MouseMoveDist > mouseMoveThreshold);
    if(glCanvas.MouseMoveDist > mouseMoveThreshold)return;
    const Physic = new e.Physic(scene);
    const ndc = getNDC(event);
    Physic.setRayfromNDC(ndc);
    const hit = Physic.raycastScene();

    
    if(hit){
        const object = hit.object;
        
        const current = colorPicker[currColorPickerIndex];
        let cube;

        for(const c of current.array){
            if(c.object === object){
                cube = c;
                break;
            }
        }

        if(cube){
            selectColorPickerCube(cube);
        }
    }
    
}

function selectColorPickerCube(cube){
    
    if(currColorPickerIndex < colorPickerDivision - 1){
        currColorPickerIndex ++;
        colorPickerExpand(cube);
        colorPickerHome(cube)
    } else {
        colorPickerHome(cube);
        finalResult(cube);
    }
    
}

function colorPickerExpand(cube){
    const cp = colorPicker[currColorPickerIndex];
    const scale = 1 / colorPickerArrayNum;
    cube.object.isActive = false;
    cp.origin.isActive = true;
    cp.origin.transform.setPosition(...cube.object.transform.position);
    cp.origin.transform.setScale(scale, scale, scale);
    setIntervalToColorPicker(cp, 0);
    setColorToColorPicker(cp, cube.min, cube.max);

    startDivideCubeAnimation(cp, colorPickerCubeInterval, colorPickerExpandAnimDuration);
}

//align rotate origin
function colorPickerHome(cube){
    
    const origin = colorPicker[0].origin;
    const currentOriginPos = vec3.clone(origin.transform.position);
    const currentOriginRot = quat.clone(origin.transform.rotation);

    origin.transform.setPosition(0, 0, 0);
    origin.transform.setEulerRotation(0, 0, 0);
    scene.updateObjectsTransform();

    const mat = cube.object.transform.worldMatrix;
    const cubeWorldPosInHome = vec3.fromValues(mat[12], mat[13], mat[14]);
    console.log(cubeWorldPosInHome);

    origin.transform.setPosition(...currentOriginPos);
    origin.transform.setRotation(...currentOriginRot);

    const cwp = cubeWorldPosInHome;
    for(const c of origin.children){
        const cpos = vec3.clone(c.transform.position);
        const npos = vec3.create()
        vec3.sub(npos, cpos, cwp);
        ObjectMoveAnim(c, npos, 1)
    }
    wheelMoveMultipier /= colorPickerArrayNum;
    pinchMoveMultiplier /= colorPickerArrayNum;
    nearCubeThreshold /= colorPickerArrayNum;
    const div = vec3.fromValues(colorPickerArrayNum, colorPickerArrayNum, colorPickerArrayNum)
    vec3.div(homeCameraPosition, homeCameraPosition, div);
    console.log(homeCameraPosition)
    ObjectMoveAnim(camera, homeCameraPosition, 1);
}

function ObjectMoveAnim(object, target, duration){
    const sPos = vec3.clone(object.transform.position);
    const loop = startLoop((time, deltatime, stop) => {
        const t = time / duration;
        const ease = t * (2 - t);

        const cPos = vec3.create();
        vec3.lerp(cPos, sPos, target, ease);
        object.transform.setPosition(...cPos);

        if(t >= 1){
            stop()
        }
    });
    object.transform.setPosition(...target);
}

function whenWheelMove(event){
    event.preventDefault();
    camera.transform.position[2] += event.deltaY * wheelMoveMultipier;
}

function whenTouchStart(e){
    const ndc = getNDC(e)[0];


    
    glCanvas.prevTouchPos = ndc;
    glCanvas.currTouchPos = ndc;
    glCanvas.isTouchMoving = true;

    if(isColorPickerAnimating){
        isColorPickerAnimating = false;
    }
}

function whenTouchMove(e){
    const ndcs = getNDC(e)
    e.preventDefault();
    glCanvas.isTouchMoving = true;
    glCanvas.currTouchPos = ndcs[0];

    if(ndcs.length > 1){
        console.log("mt");
        glCanvas.isMultiTouching = true;
        glCanvas.secondTouchPos = ndcs[1];
        console.log(ndcs);
        glCanvas.currMultiTouchDist = vec3.dist(ndcs[0], ndcs[1]);
        console.log(glCanvas.currMultiTouchDist);
    }else{
        glCanvas.isMultiTouching = false;
        
    }


}

function whenTouchEnd(e){
    glCanvas.isTouchMoving = false;
    glCanvas.isMultiTouching = false;
    glCanvas.currTouchPos = getNDC(e);
    glCanvas.prevTouchPos = getNDC(e);
    glCanvas.deltaMultiTouchDist = null;
    glCanvas.prevMultiTouchDist = null;
    glCanvas.currMultiTouchDist = null;
}

function NDCtoWorld(ndc, camera){
    const tmp = vec4.create();
    const vp = camera.vp;
    const vpi = mat4.create();
    mat4.invert(vpi, vp);
    
    tmp[0] = ndc[0];
    tmp[1] = ndc[1];
    tmp[2] = -1;
    tmp[3] = 1;
    vec4.transformMat4(tmp, tmp, vpi);

    tmp[0] /= tmp[3];
    tmp[1] /= tmp[3];
    tmp[2] /= tmp[3];

    
    return vec3.fromValues(...tmp)
}

function getNDC(event){
    if(event.touches){
        const ndcs = [];
        const rect = canvasElement.getBoundingClientRect();
        const touches = event.touches;
        const l = touches.length;
        
        for(let i = 0; i < l; i++){
            const x = touches[i].clientX - rect.left;
            const y = touches[i].clientY - rect.top;
            const ndc = vec3.fromValues(x / rect.width * 2 - 1, y / -rect.height * 2 + 1, -1);

            ndcs.push(ndc);
        }
        return ndcs;

    }else{
        const rect = canvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const ndc = vec3.fromValues(x / rect.width * 2 - 1, y / -rect.height * 2 + 1, -1);
        
        return ndc;
    }
    
}


function startDivideCubeAnimation(picker, interval, duration){
    const loop = startLoop((time, deltatime, stop) => {
        const t = time / duration;
        const ease = t * (2 - t);

        setIntervalToColorPicker(picker, interval * ease);

        if(time >= duration){
            setIntervalToColorPicker(picker, interval);
            stop();
        }
    })
}

function setIntervalToColorPicker(picker, interval){
    const n = colorPickerArrayNum;
    const b = n + n * interval - 1;
    let i = 0;
    for(let x = 0; x < n; x++){
        for(let y = 0; y < n; y++){
            for(let z = 0; z < n; z++){
                const cube = picker.array[i];
                const object = cube.object;
                object.transform.setPosition(
                    x / (n - 1) * b - b / 2,
                    y / (n - 1) * b - b / 2,
                    z / (n - 1) * b - b / 2) 
                i++;
            }
        }
    }
}


function setColorToColorPicker(picker, min, max){
    const n = colorPickerArrayNum;
    const minr = min[0];
    const ming = min[1];
    const minb = min[2];
    const maxr = max[0];
    const maxg = max[1];
    const maxb = max[2];
    const rangeR = (maxr - minr) / n;
    const rangeG = (maxg - ming) / n;
    const rangeB = (maxb - minb) / n;
    

    let i = 0;
    for(let x = 0; x < n; x++){
        for(let y = 0; y < n; y++){
            for(let z = 0; z < n; z++){
                const cube = picker.array[i];
                const material = cube.object.material;
                const _minr = Math.ceil(minr + rangeR * x);
                const _ming = Math.ceil(ming + rangeG * y);
                const _minb = Math.ceil(minb + rangeB * z);
                cube.min = [_minr, _ming, _minb];
                material.uniform4fv[0].value = vec4.fromValues(_minr / 255, _ming / 255, _minb / 255, 1.0);

                const _maxr = Math.floor(minr + rangeR * (x + 1));
                const _maxg = Math.floor(ming + rangeG * (y + 1));
                const _maxb = Math.floor(minb + rangeB * (z + 1));
                cube.max = [_maxr, _maxg, _maxb];
                material.uniform4fv[1].value = vec4.fromValues(_maxr / 255, _maxg / 255, _maxb / 255, 1.0);
                
                i++;
            }
        }
    }
}

function createColorPicker(scene){

    const colorPicker = [];
    const n = colorPickerArrayNum;
    const Physic = new e.Physic(scene);
    //create color picker divisions
    for(let d = 0; d < colorPickerDivision; d++){
        const origin = new e.CObject();
        
        const array = [];
        for(let x = 0; x < n; x++){
            for(let y = 0; y < n; y++){
                for(let z = 0; z < n; z++){
                    const object = new e.CObject();
                    const min = null;
                    const max = null;
                    const cube = {
                        min : min,
                        max : max,
                        object : object
                    }

                    cube.object.collider = Physic.createBoxCollider(1);
                    cube.object.mesh = cubeMesh;
                    cube.object.material = cubeMainMaterial.copy();

                    array.push(cube);
                    origin.children.push(object);

                }
            }
        }
        
        if(d != 0){
            colorPicker[d - 1].origin.children.push(origin);
            origin.isActive = false;
        }

        colorPicker.push({origin : origin, array : array});
    
    }

    return colorPicker;
    
}


function startLoop(onFrame){
    const loop = {
        id : null,
        startTime : null,
        currTime : null,
        prevTime : null,
        deltaTime : null,
        isRunning : true,
        stop(){
            cancelAnimationFrame(this.id);
            this.isRunning = false;
        }
    }

    function frame(timeStamp){

        if(!loop.isRunning){
            return;
        }

        loop.id = requestAnimationFrame(frame);

        if(!loop.startTime){
            loop.startTime = timeStamp;
        }


        
        loop.currTime = timeStamp - loop.startTime;
        loop.deltaTime = !loop.prevTime ? 0 : loop.currTime - loop.prevTime;
        loop.prevTime = loop.currTime;

        try {
            onFrame(loop.currTime * 0.001, loop.deltaTime * 0.001, () =>{
                loop.isRunning = false;
                cancelAnimationFrame(loop.id);
            });
        } catch(e) {
            cancelAnimationFrame(loop.id);
            loop.isRunning = false;
            throw new Error(e);
        }
        
    }

    loop.id = requestAnimationFrame(frame);

    return loop;
}