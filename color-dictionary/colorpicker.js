

//shader source
const vertexShaderSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;
attribute float aIndex;

uniform mat4 uMVPMatrix;
uniform vec4 uMainColor;

varying vec3 vNormal;
varying vec2 vUV;
varying float vIndex;
varying vec4 vMainColor;
void main(){
    gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
    
    vNormal = normalize(uMVPMatrix * vec4(aNormal, 1.0)).xyz;
    
    vUV = aUV;
    vIndex = aIndex;
    vMainColor = uMainColor;
}
`;

const fragmentShaderSource = `
precision mediump float;

varying vec3 vNormal;
varying vec2 vUV;
varying float vIndex;

varying vec4 vMainColor;

void main(){
    float u = vUV[0];
    float v = vUV[1];
    float r, g, b;
    vec3 col;
    r = 1.0;
    g = 1.0;
    b = 1.0;

    vec3 n = normalize(vNormal.xyz);
    vec3 l = normalize(vec3(1.0, 1.0, 1.0));
    vec3 view = normalize(vec3(0.0, 0.0, -1.0));

    float lightness = n.x * l.x + n.y * l.y + n.z * l.z;
    if(lightness < 0.0)lightness = 0.0;
    float viewDot = n.x * view.x + n.y * view.y + n.z * view.z;
    float back = (1.0 - abs(viewDot)) * 2.0;
    
    gl_FragColor = vec4(r * lightness, g * lightness, b * lightness, 1.0);
}
`;

const canvas = document.querySelector('#colorPickerCanvas');
const gl = canvas.getContext("webgl");

if(!gl){
    alert("WebGL is not supported by your browser.");
    throw new Error("WebGL is not supported by this browser");
}

const { mat4, vec2, vec3, vec4, quat } = glMatrix;
const PI = Math.PI;
const f32Size = Float32Array.BYTES_PER_ELEMENT;
const colliderType = {
    BOX: 1 << 0,
};

const hierarchy = createHierarchy();
const camera = createCamera();
hierarchy.camera = camera;
const material = createMaterial(vertexShaderSource, fragmentShaderSource);
const cubeArray = createCubeObjectArray(
    vec3.fromValues(0, 0, 0),
    6,
    6,
    6,
    1,
    1/12,
    material 
);
const origin = createObject();
origin.transform.position = vec3.fromValues(0, 0, -2);
origin.children.push(...cubeArray);
console.log(origin);

console.log(cubeArray);
//hierarchy.objects.push(...cubeArray);
hierarchy.objects.push(origin);

const stop = startRenderHierarchy(hierarchy);

const loop = startLoop((delta, time) => {
    hierarchy.objects[0].transform.rotation.euler[1] += delta;
    hierarchy.objects[0].transform.rotation.euler[2] += delta;
    hierarchy.objects[0].transform.update();
    const hit = raycastHierarchy(vec3.fromValues(.2, 0.1, 0), vec3.fromValues(0, 0, -1), hierarchy);
    
    if(hit){
        console.log(hit.object.id, hit.object.transform.position);
        
    }
});

function raycastHierarchy(origin, direction, hierarchy){
    const objects = hierarchy.objects;
    let nearest = {
        length: Infinity,
        object: null
    };

    for(let i = 0; i < objects.length; i++){
        const hit = raycastObject(origin, direction, objects[i]);
        if(hit){
            nearest = nearest.length > hit.length ? hit : nearest;
        }
    }

    return nearest.length === Infinity ? null : nearest;
}

function raycastObject(origin, direction, object){
    const collider = object.collider;

    const id = object.id;
    const children = object.children;
    let nearest = {
        length: Infinity,
        object: null,
    };

    if(children){
        
        for(let i = 0; i < children.length; i++){
            const _hit = raycastObject(origin, direction, children[i]);
            if(_hit){
                
                nearest = nearest.length < _hit.length ? nearest : _hit;
            }
        }
    }

    if(collider){

        const cType = collider.type;
        const world = object.transform.world;
        const local = mat4.create();
        mat4.invert(local, world);
        const _origin = vec4.create();
        vec4.transformMat4(_origin, vec4.fromValues(...origin, 1), local);
        const _direction = vec4.create();
        vec4.transformMat4(_direction, vec4.fromValues(...direction, 0), local);

        

        if(cType === colliderType.BOX){
            const a = collider.collider.corners.a;
            const b = collider.collider.corners.b;
            const selfHit = raycastAABB(_origin, _direction, a, b);
            if (selfHit) {
                selfHit.object = object;
                nearest = nearest.length < selfHit.length ? nearest : selfHit;
            }
            
        }
    }
        
    return nearest.length === Infinity ? null : nearest;
}

function raycastAABB(origin, direction, a, b){


    let t1, t2;
    let enter = [], exit = [];

    for(let i = 0; i < 3; i++){
        const o = origin[i];
        const d = direction[i];
        const min = Math.min(a[i], b[i]);
        const max = Math.max(a[i], b[i]);

        if(Math.abs(d) < 0.000001){
            if(o < min || o > max) return null;
            t1 = -Infinity;
            t2 = Infinity;
        } else {
            t1 = (min - o) / d;
            t2 = (max - o) / d;
        }
        
        enter.push(Math.min(t1, t2));
        exit.push(Math.max(t1, t2));
    }

    const tenter = Math.max(...enter);
    const texit = Math.min(...exit);

    const hit = {
        length: Math.max(tenter, 0),
        object: null
    };
    return tenter <= texit && texit >= 0 ? hit : null;
}

function createScreenBaseQuaterninon(delta){
    const x = delta.x;
    const y = delta.y;

    const q = quat.create();
    const axis = vec3.fromValues(x, y, 0);
    const angle = Math.sqrt(x * x + y * y);
    quat.setAxisAngle(q, axis, angle);
    return q;
}

function startLoop(onFrame) {
    let previousTime = null;
    let animationId = null;
    let isRunning = true;

    function frame(timeStamp) {
        if (!isRunning) return;

        animationId = requestAnimationFrame(frame);

        const currentTime = timeStamp * 0.001;
        const deltaTime =
            previousTime === null ? 0 : currentTime - previousTime;

        previousTime = currentTime;

        try {
            onFrame(deltaTime, currentTime);

        } catch(error) {
            throw new Error("in animation loop", error);
            stopLoop();
        };
    }

    animationId = requestAnimationFrame(frame);

    function stopLoop() {
        isRunning = false;
        cancelAnimationFrame(animationId);
    }

    return stopLoop;
}

function startRenderHierarchy(hierarchy){
    const camera = hierarchy.camera;
    const light = hierarchy.light;
    const objects = hierarchy.objects;

    
    const renderLoop = startLoop((delta, time) => {
        clearRender(canvas, camera);
        objects.forEach((object) => {
            object.transform.update();
            renderObject(object, camera);
        });
    });

    return renderLoop;
}

function createCubeObjectArray(origin = vec3.fromValues(0, 0, 0), xNum, yNum, zNum, size = 1, scale = 0.1, material){
    const cubeArray = [];
    const position = vec3.create();
    let id = 0;
    for(let x = 0; x < xNum; x++){
        for(let y = 0; y < yNum; y++){
            for(let z = 0; z < zNum; z++){
                const cube = createCubeObject(size, scale, material);
                const positionX = origin[0] + x / xNum * size - size / 2;
                const positionY = origin[1] + y / yNum * size - size / 2;
                const positionZ = origin[2] + z / zNum * size - size / 2;
                
                cube.transform.position = vec3.fromValues(positionX, positionY, positionZ);
                cube.transform.scale = vec3.fromValues(scale, scale, scale);
                cube.transform.update();
                cube.id = id;
                cube.collider = createBoxCollider(scale);
                id++;
                cubeArray.push(cube);
            }
        }
    }

    return cubeArray;
}

function createCubeObject(size = 1, scale = 1, material = null){
    const cube = createObject();
    cube.material = material;
    cube.mesh = createMesh(createCubeArray(size));
    cube.transform.scale = vec3.fromValues(scale, scale, scale);
    cube.transform.update();
    return cube;
}

function createBoxCollider(size = 1){
    const s = size / 2;

    return {
        type: colliderType.BOX,
        collider: {
            corners: {
                a: [-s, s, s],
                b: [ s, -s, -s]
            },
        }
    }
}

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
            let nor = vec3.fromValues(corner[3], corner[4], corner[5]);
            vec3.transformMat4(pos, pos, mat);
            vec3.transformMat4(nor, nor, mat);
            vertices.push(
                ...pos,
                ...nor,
                corner[6], corner[7], i
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
    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function createHierarchy(){
    const hierarcy = {
        camera : null,
        resolution : 1.0,
        objects: [],
        light: null,
        render: function() {

            this.objects.forEach(object => {

                renderObject(object, this.camera);
                
            });
        }
    }
    return hierarcy;
}

function renderObject(object, camera, parentMatrix = null){

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
    mat4.copy(object.transform.world, world);

    //render children first
    if(children){
        children.forEach(child => {
            renderObject(child, camera, world);    
        });
    }

    if(!object.mesh){
        return;
    }

    gl.useProgram(material.program);

    //get vertex buffer
    const buffer = mesh.buffer;
    const stride = mesh.stride;

    //get attribOffset
    const vOffset = mesh.vertOffset;
    const nOffset = mesh.normOffset;
    const uOffset = mesh.uvOffset;
    const indexOffset = mesh.indexOffset;

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
    const indexLocation = material.attributes.index;
    const mvpLocation = material.uniforms.mvp;


    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);

    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(normalLocation);
    gl.enableVertexAttribArray(uvLocation);
    gl.enableVertexAttribArray(indexLocation);

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

    gl.vertexAttribPointer(
        indexLocation,
        1,
        gl.FLOAT,
        false,
        stride,
        indexOffset
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
        children: [],
        id: null,
        collider: null,

    }
    return object;
}

function createMesh(vertices){
    let mesh = {
            vertices: null,
            buffer: null,
            //vec3, vec3, vec2, float1
            stride: 9 * f32Size,
            vertCount: null,

            vertOffset : 0,
            normOffset : 3 * f32Size,
            uvOffset : 6 * f32Size,
            indexOffset : 8 * f32Size,
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
        attributes: {
            position: null,
            normal: null,
            uv: null,
            index: null
        },
        uniforms: {
            mvp : null,
            additional : []
        },
        setAdditional : function(name, type, value){
            const additional = {
                name : name,
                type : type,
                value: value,
                location: null,
            }
            additional.location = gl.getUniformLocation(material.program, name);
            this.uniforms.additional.push(additional);
        },
    }
    let success;

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vert);
    gl.compileShader(vertShader);
    success = gl.getShaderParameter(vertShader,gl.COMPILE_STATUS);
    if(!success){
        console.error(gl.getShaderInfoLog(vertShader));
    }

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, frag);
    gl.compileShader(fragShader);
    success = gl.getShaderParameter(fragShader, gl.COMPILE_STATUS);
    if(!success){
        console.error(gl.getShaderInfoLog(fragShader));
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(!success){
        console.error(gl.getProgramParameter(program, gl.LINK_STATUS));
        gl.deleteProgram(program);
    }
    material.program = program;
    material.attributes.position = gl.getAttribLocation(program, "aPosition");
    material.attributes.normal = gl.getAttribLocation(program, "aNormal");
    material.attributes.uv = gl.getAttribLocation(program, "aUV");
    material.attributes.index = gl.getAttribLocation(program, "aIndex");
    material.uniforms.mvp = gl.getUniformLocation(program, "uMVPMatrix");

    return material;
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

        world: mat4.create(),

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