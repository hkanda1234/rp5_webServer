import { vec2, vec3, vec4, mat4, quat } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

import * as e from './engine.js';
import * as cpShader from './colorpickerShader.js';


const colorpickerDivision = 4;


const canvas = document.querySelector('#colorPickerCanvas')
const colorPickerCanvas = new e.GLCanvas(canvas);

colorPickerCanvas.scene = new e.Scene();
const scene = colorPickerCanvas.scene;
const gl = colorPickerCanvas.gl;
const object = new e.CObject();
const mesh = e.Mesh.createCube(gl, 1);
const material = e.Material.create(gl, cpShader.source);
object.mesh = mesh;
object.material = material;
const camera = new e.Camera();
camera.transform.setPosition(0, 0, 3);
object.transform.setEulerRotation(0, Math.PI / 4, 0);
object.mainColor = vec4.fromValues(1, 1, 1, 1);
scene.addObject(object);

colorPickerCanvas.clear(vec4.fromValues(0,0,0,1));

object.render(gl, camera, null);



console.log(object);

class ColorPicker {
    constructor(){
        this.color = {
            min : null,
            max : null,
        }
    }
}
