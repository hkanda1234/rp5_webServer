//shader source
const vertexShaderSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;

uniform mat4 uMVPMatrix;

varying vec3 vNormal;
varying vec2 vUV;
void main(){
    gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
    
    vNormal = aNormal;
    vUV = aUV;
}
`;

const fragmentShaderSource = `
precision mediump float;

varying vec3 vNormal;
varying vec2 vUV;
void main(){
    float u = vUV[0];
    float v = vUV[1];
    float r, g, b;

    r = v;
    g = (1.0 - u) * v;
    b = (1.0 - u) * v;
    gl_FragColor = vec4(r, g, b, 1.0);
}
`;

const canvas = document.querySelector('#colorPickerCanvas');
const gl = canvas.getContext("webgl");

if(!gl){
    alert("WebGL is not supported by your browser.");
    throw new Error("WebGL is not supported by this browser");
}

const { mat4, vec3 } = glMatrix;
const PI = Math.PI;
const f32Size = Float32Array.BYTES_PER_ELEMENT;

resizeCanvasToDisplaySize(canvas);

let camera = createCamera();
camera.transform.position = vec3.fromValues(0, 0, 0);
camera.transform.rotation.euler = vec3.fromValues(0, 0, 0);

console.log(camera);
let material = createMaterial(vertexShaderSource, fragmentShaderSource);
console.log(material);

let cube = createObject();
cube.transform.position = vec3.fromValues(0, 0, -2);
cube.transform.rotation.euler = vec3.fromValues(PI / 5, PI / 6, 0);
cube.transform.update();
cube.mesh = createMesh(createCubeArray(1));
cube.material = material;

let cube2 = createObject();
cube2.transform.position = vec3.fromValues(0, 0, 1);
cube2.transform.rotation.euler = vec3.fromValues(0, 0, 0);
cube2.transform.update();
cube2.mesh = createMesh(createCubeArray(.3));
cube2.material = material;

cube.children.push(cube2);

console.log(cube);
clearRender(canvas);
renderObject(cube, camera);

const hierarchy = createHierarchy();


//front program
function createCubeArray(size = 1) {
    const s = size / 2;
    const frontCorners = [
        [-s,  s,  s, 0.0, 0.0, 1.0, 0.0, 1.0],
        [-s, -s,  s, 0.0, 0.0, 1.0, 0.0, 0.0],
        [ s,  s,  s, 0.0, 0.0, 1.0, 1.0, 1.0],
        [ s, -s,  s, 0.0, 0.0, 1.0, 1.0, 0.0],
    ];
    const rotations = [
        //front
        [0, 0, 0],
        //back
        [0, DegToRad(180), 0],
        //top
        [DegToRad(-90), 0, 0],
        //bottom
        [DegToRad(90), 0, 0],
        //left
        [0, DegToRad(-90), 0],
        //right
        [0, DegToRad(90), 0],
    ];

    let vertices = [];
    const indecies = [0, 1, 2, 2, 1, 3];

    for(let i = 0; i < 6; i++){
        const rot = rotations[i];
        let mat = mat4.create();
        mat4.rotateX(mat, mat, rot[0]);
        mat4.rotateY(mat, mat, rot[1]);
        mat4.rotateZ(mat, mat, rot[2]);

        for(let j = 0; j < 6; j++){
            let corner = frontCorners[indecies[j]];
            let pos = vec3.fromValues(corner[0], corner[1], corner[2]);
            vec3.transformMat4(pos, pos, mat);
            vertices.push(
                ...pos,
                corner[3], corner[4], corner[5],
                corner[6], corner[7]
            );
        }
       
    }
    const buffer = new Float32Array(vertices);
    return buffer;

}



//rendering tool definition
//vertex data is defined as [pos, uv, normal]
function resizeCanvasToDisplaySize(canvas, resolution = 1.0){
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(canvas.clientWidth * dpr / 2);
    const displayHeight = Math.floor(canvas.clientHeight * dpr / 2);
    if(displayWidth != canvas.width || displayHeight != canvas.height){
        canvas.width = displayWidth * resolution;
        canvas.height = displayHeight * resolution;
        return true;
    }
    return false;
}

function clearRender(canvas){
    resizeCanvasToDisplaySize(canvas);
    camera.update();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function createHierarchy(){
    const render = {
        camera : null,
        resolution : 1.0,
        objects: null,
        lights: null,
        render: function() {

            this.objects.forEach(object => {

                renderObject(object, this.camera);
                
            });
        }
    }
}

function renderObject(object, camera, parentMatrix){

    if(!object || !camera) {
        console.error("renderObject: object or camera is not difined!");
        return;
    };

    if(!object.transform){
        return;
    }

    const transform = object.transform;
    let local = transform.matrix;
    let world = mat4.create();
    const mesh = object.mesh;
    const material = object.material;
    const children = object.children;

    if(parentMatrix) {
        mat4.multiply(world, parentMatrix, local);
    } else {
        mat4.copy(world, local);
    }

    //render children first
    if(children){
        children.forEach(child => {
            renderObject(child, camera, world);    
        });
    }

    gl.useProgram(material.program);

    //get vertex buffer
    const buffer = mesh.buffer;
    const stride = mesh.stride;

    //get attribOffset
    const vOffset = mesh.vertOffset;
    const nOffset = mesh.normOffset;
    const uOffset = mesh.uvOffset;

    //get element count
    const vCount = mesh.vertCount;
    const triCount = vCount / 3 ;

    //create MVPmatrix
    const vp = camera.vp;
    
    

    const mvpMatrix = createMVPMatrix(world, vp);
    
    //get attribLocation
    const positionLocation = material.attributes.position;
    const normalLocation = material.attributes.normal;
    const uvLocation = material.attributes.uv;
    const mvpLocation = material.uniforms.mvp;


    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);

    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(normalLocation);
    gl.enableVertexAttribArray(uvLocation);

    gl.vertexAttribPointer(
        positionLocation,
        3,
        gl.FLOAT,
        false,
        stride,
        vOffset
    );

    gl.vertexAttribPointer(
        normalLocation,
        3,
        gl.FLOAT,
        false,
        stride,
        nOffset
    )

    gl.vertexAttribPointer(
        uvLocation,
        2,
        gl.FLOAT,
        false,
        stride,
        uOffset
    );

    gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix);

    gl.enable(gl.DEPTH_TEST);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertCount);
    

}

function createMVPMatrix(model, vp){
    const mvp = mat4.create();
    mat4.multiply(mvp, vp, model);
    return mvp;
}

function createCamera(fovY = 90, near = 0.1, far = 100){
    const camera = {
        transform: createTransform(),
        fovY: DegToRad(90),
        near: near,
        far: far,
        aspect: getAspect(),
        perspective: mat4.create(),
        view: mat4.create(),
        vp: mat4.create(),
        update(){
            this.aspect = getAspect();
            //create perspective matrix
            mat4.perspective(
                this.perspective,
                this.fovY,
                this.aspect,
                this.near,
                this.far
            );
            this.transform.update();
            //create view matrix
            mat4.invert(this.view, this.transform.matrix);
            //create VP matrix
            mat4.multiply(this.vp, this.perspective, this.view);
            
        },
    };

    camera.update();
    return camera;
}

function getAspect(){
    return canvas.width / canvas.height;
}

function DegToRad(deg){
    return deg / 180 * PI;
}

function createObject(){
    const object = {
        transform : createTransform(),
        mesh : null,
        material : null,
        parent: null,
        children: []
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

            vertOffset : 0,
            normOffset : 3 * f32Size,
            uvOffset : 6 * f32Size,
    };
    mesh.vertices = new Float32Array(vertices);
    mesh.vertCount = vertices.length / mesh.stride * f32Size;
    mesh.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
    return mesh;
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
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(!success){
        console.error(gl.getProgramParameter(program, gl.LINK_STATUS));
        gl.deleteProgram(program);
    }

    return material = {
        program : program,
        attributes: {
            position: gl.getAttribLocation(program, "aPosition"),
            normal: gl.getAttribLocation(program, "aNormal"),
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