import { vec2, vec3, vec4, mat4, quat } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

import * as e from './engine.js';
import * as cpShader from './colorpickerShader.js';

const backgroundColor = vec4.fromValues(1, 1, 1, 1);

const canvasElement = document.querySelector("#colorPickerCanvas");

const glCanvas = new e.GLCanvas(canvasElement);
const gl = glCanvas.gl;
const scene = new e.Scene(gl);
const camera = new e.Camera(canvasElement);


glCanvas.scene = scene;
scene.camera = camera;

const mesh = e.Mesh.createCube(gl, 1);
const material = e.Material.createFromSource(gl, cpShader.source);
const cube = new e.CObject();
cube.material = material;
cube.mesh = mesh;
cube.transform.setPosition(0, 0, -3);
cube.transform.setEulerRotation(45, 45, 0);
scene.add(cube);

console.log(cube, camera, scene);

glCanvas.startRender();




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