const canvas = document.querySelector('#colorPickerCanvas');
const gl = canvas.getContext("webgl");

if(!gl){
    alert("WebGL is not supported by your browser.");
    throw new Error("WebGL is not supported by this browser");
}

const { mat4, vec3 } = glMatrix;
const PI = Math.PI;
const f32Size = Float32Array.BYTES_PER_ELEMENT;

let cameraTransform = createObject();
console.log(cameraTransform);

function resizeCanvasToDisplaySize(canvas){
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(canvas.clientWidth * dpr / 2);
    const displayHeight = Math.floor(canvas.clientHeight * dpr / 2);
    if(displayWidth != canvas.width || displayHeight != canvas.height){
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        return true;
    }
    return false;
}
//front program

//shader source

//high level function definition

function renderObjectHierarchy(hierarchy){
    if(!hierarchy.objects) return;
    const objects = hierarchy.objects;

}

function createObjectHierarchy(){
    const hierarchy = {

    };
    return hierarchy;
}

//low level function definition
//vertex data is defined as [pos, uv, normal]

function clearRender(){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function renderObject(object, camera){

    if(!object || !camera) {
        console.error("renderObject: object or camera is not difined!");
        return;
    };

    const transform = object.transform;
    const matrix = transform.matrix;
    const mesh = object.mesh;
    const material = object.material;


}

function createObject(){
    const object = {
        transform : createTransform(),
        mesh : {
            vertices: null,
            buffer: null,
            stride: 8 * f32Size,
            vertCount: null,

            vertOffset : 0,
            normOffset : 3 * f32Size,
            uvOffset : 6 * f32Size,

            attribLocation : null,
        },
        material : {

        },
    }
    return object;
}

function createMesh(vertices){
    let mesh = {
            vertices: null,
            buffer: null,
            //vec3, vec3, vec2
            stride: 8 * f32Size,
            vertCount: null,

            vertOffset = 0,
            normOffset = 3 * f32Size,
            uvOffset = 6 * f32Size,
        }
    mesh.vertices = vertices;
    mesh.vertCount = vertices.length / stride;
    mesh.buffer = gl.createBuffer();
    gl.bindBuffer(gl.Float32Array, buffer)
}

function createMaterial(vert, frag){
    
    let material = {
        program: null,
        attributes: null,
        uniforms: null,
    }

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vert);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, frag);
    gl.compileShader(fragShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);


    return material = {
        program : program,
        attributes: {
            position: gl.getAttribLocation(program, "aPosition"),
            uv: gl.getAttribLocation(program, "aUV"),
        },
        uniforms: {
            mvp : gl.getUniformLocation(program, "uMVPMatrix")
        }
    };
}

function createTransform(
    translate = [0, 0, 0],
    rotation  = [0, 0, 0],
    scale     = [1, 1, 1],
){   
    const trs = {
        position:  vec3.fromValues(...translate),

        rotation:  {
            euler: vec3.fromValues(...rotation),
            matrix: mat4.create(),
        },
        
        scale:     vec3.fromValues(...scale),

        matrix:    mat4.create(),

        update(){
            mat4.identity(this.matrix);
            mat4.identity(this.rotation.matrix);
            
            mat4.rotateX(this.rotation.matrix, this.rotation.matrix, this.rotation.euler[0]);
            mat4.rotateY(this.rotation.matrix, this.rotation.matrix, this.rotation.euler[1]);
            mat4.rotateZ(this.rotation.matrix, this.rotation.matrix, this.rotation.euler[2]);

            mat4.translate(this.matrix, this.matrix, this.position);
            mat4.multiply(this.matrix, this.matrix, this.rotation.matrix);
            mat4.scale(this.matrix, this.matrix, this.scale);
            return this.matrix;
        },
    };

    trs.update();
    return trs;
}