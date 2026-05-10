import { vec2, vec3, vec4, mat4, quat } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";




export class GLCanvas {
    constructor(canvasElement){
        this.gl = canvasElement.getContext('webgl');
        this.canvas = canvasElement;
        this.scene = null;
        this.resolution = 1;
        this.dpr = window.devicePixelRatio || 1;
        this.width = Math.floor(canvasElement.clientWidth * this.dpr);
        this.height = Math.floor(canvasElement.clientHeight * this.dpr);
        
        this.aspect = null;
    }

    resizeToDisplaySize(){
        this.width = Math.floor(canvasElement.clientWidth * this.dpr);
        this.heiht = Math.floor(canvasElement.clientHeight * this.dpr);

        if(this.width != canvasElement.width || this.height != canvasElement.height){
            
        }
    }

    clear(color){

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(...color);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
}
//scene
export class Scene {
    constructor() {
        this.camera = null;
        this.objects = [];
    }

    findObjectById(id){
        this.objects.forEach(o => {
            if(o.id === id){
                return o;
            }
            o.children.forEach(c => {
                if(c.id === id){
                    return c;
                }
            });
        });
        return null;
    }

    updateObjectsTransform(){
        this.objects.forEach(o => {
            const local = o.transform.localMatrix;
            if(o.children.length > 0){

            }
        });
    }


}

export class Physic {
    
}

export class Camera {
    constructor(
        fovY = Math.PI / 4,
        near = 0.01,
        far = 1000,
        aspect = 9 / 16
    )
    {
        this.transform = new Transform();
        this.fovY = fovY;
        this.near = near;
        this.far = far;
        this.aspect = aspect;

        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.persMatrix = mat4.create();
    }
}

//render
export class Renderer{

}
//object
export class Object {
    constructor(){
        this.isActive = true;
        this.transform = new Transform();
        this.mesh = new Mesh();
        this.material = new Material();
        this.children = [];
        this.id = null;
        this.collider = null;
        this.mainColor = null;
    }
    
    setPosition(pos){
        this.transform.setPosition(pos);
    }

    setRotation(rot){
        this.transform.setRotation(rot);
    }

    setScale(scale){
        this.transform.setScale(scale)
    }
}
//material
export class Material {
    constructor(){
        this.program = null;
        this.uniforms = {};
    }
}
//mesh
export class Mesh {
    constructor(){
        this.vertices = [];
        this.buffer = null;
        this.vertCount = null;
        //pos, nor, uv, index
        this.stride = Float32Array.BYTES_PER_ELEMENT * 9;
        this.vertOffset = 0,
        this.normOffset = Float32Array.BYTES_PER_ELEMENT * 3;
        this.uvOffset = Float32Array.BYTES_PER_ELEMENT * 6;
    };

    bufferVertices(gl, vertices){
        this.vertices = vertices;
        this.vertCount = vertices.length / this.stride;
    } 
}

//transform
export class Transform {
    constructor(){
        this.position = vec3.fromValues(0, 0, 0);
        this.rotation = quat.fromValues(0, 0, 0, 1);
        this.scale = vec3.fromValues(1, 1, 1);
        this.localMatrix = mat4.create();
        this.worldMatrix = mat4.create();
        this.parentMatrix = null;
    }

    setPosition(pos){
        vec3.copy(this.position, pos);
    }

    setRotation(rot){
        quat.copy(this.rotation, rot);
    }

    setScale(scale){
        vec3.copy(this.scale, scale);
    }
}
