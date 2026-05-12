import { vec2, vec3, vec4, mat4, quat } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

import * as e from './engine.js';
import * as cpShader from './colorpickerShader.js';



class ColorPicker {
    constructor(){
        this.color = {
            min : null,
            max : null,
        }
    }
}
