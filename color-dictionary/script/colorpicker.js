

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
varying float lightness;
varying float vDepth;

void main(){

    vec3 light;
    light[0] = 1.0;
    light[1] = 1.0;
    light[2] = 1.0;

    gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
    
    vDepth = gl_Position.z / gl_Position.w;

    vNormal = normalize(uMVPMatrix * vec4(aNormal, 1.0)).xyz;
    lightness = dot(vNormal, light);
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
varying float lightness;

void main(){
    float u = vUV[0];
    float v = vUV[1];
    float r, g, b, a;
    
    vec4 col = vMainColor;
    vec4 inv = vMainColor;
    vec3 nor = vNormal;


    inv[0] = 1.0 - inv[0];
    inv[1] = 1.0 - inv[1];
    inv[2] = 1.0 - inv[2];

    float edge = 0.01;

    if(u > 1.0 - edge || v > 1.0 - edge || u < edge || v < edge) {
        col[0] = inv[0];
        col[1] = inv[1];
        col[2] = inv[2];
    };

    
    r = col[0];
    g = col[1];
    b = col[2];
    a = 1.0;

    
    
    gl_FragColor = vec4(r, g, b, a);
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
const matAdditionalType = {
    vec4: 0
}
const colliderType = {
    BOX: 1 << 0,
};
const backgroundColor = [1, 1, 1, 1];

let isDragging = false;
let isPinching = false;

let isTouchMoving = false;

const dragThreshhold = 0.1;

let firstMousePosition = null;
let prevMousePosition = null;
let currMousePosition = null;
let mouseMoveDistance = 0;

let firstTouchPosition = null;
let prevTouchPosition = null;
let currTouchPosition = null;
let touchMoveDistance = 0;
let touchMoveDirection = vec3.create();

let currTouchCount = 0;
let prevTouchCount = 0;
let currTouchDistance = null;
let prevTouchDistance = null;

let angularVelocityAxis = vec3.create();
let angularVelocity = 0;
let angularVelocityDeclineSpeed = 10;

let initialAngularVelocity = 0;

let translationVelocity = null;

let originQuat = quat.create();
let originQuatDelta = quat.create();

const wheelMoveMultipier = 0.1;

const colorpickerQuantLevel = 4;

const colorPickerModels = {
    objects : [],
    colorBind : {
        id : [],
        min : [],
        max : [],
    }
};


const cubeSize = 1;
const cubeArraySize = Math.pow(256, 1 / colorpickerQuantLevel);
const cubeArrayBound = 5;

const cubeArrayIdentity = quat.create();
quat.identity(cubeArrayIdentity);

const expandCubeSize = cubeArrayBound + cubeSize * 2;
const expandAnimationDuration = 1;

const nearCubeThreshold = 5;
const nearCubeScaleDuration = 0.15;
const nearCubeScale = vec3.fromValues(0, 0, 0);
let prevNearCubes = [];
let currNearCubes = [];

let isAnimating = false;

const initialCameraPosition = vec3.fromValues(0, 0, 30);



canvas.addEventListener('touchstart', whenTouchStart);
canvas.addEventListener('touchmove', whenTouchMove);


canvas.addEventListener('wheel', whenWheelMove);
document.addEventListener('mousemove', whenTouchMove);
document.addEventListener('touchend', whenTouchEnd);
canvas.addEventListener('click', whenClicked)
//タッチ操作：
//一本指でOrigin回転
//二本指でカメラ操作：
//xy方向　：左右に平行移動
//ピンチ　：z方向に移動

//マウス操作：
//ドラックでOrigin回転
//ホイールでz方向の移動
//ホイールドラックで左右に平行移動


function startApp(hierarchy){
    const appLoop = startLoop((deltaTime, time) => {
        
        //model rotation control
        if(isTouchMoving){
            if(!prevTouchPosition){
                prevTouchPosition = currTouchPosition;
            }

            rotateorigin(deltaTime);
            
        }else if(angularVelocity >= 0){
            inertiaRotateorigin(deltaTime);
        }

        scaleNearObject(origin);

        prevTouchPosition = currTouchPosition;
    });
    return appLoop;
}

function createColorIdBind(origin, min, max){
    const cubes = origin.children;
    const bind = {
        id : [],
        color : []
    }
    
    for(let i = 0; i < Math.pow(cubeArraySize, 3); i++){}
}

function createColorpickerArray(size, bound, min, max) {
    const origin = createObject();
    const l = currCubeContainColorPerAxis
    for(let x = 0; x < l; x++){
        for(let y = 0; y < l; y++){
            for(let z = 0; z < l; z++){
                const x = bound * x / (l - 1) - bound / 2;
                const y = bound * y / (l - 1) - bound / 2;
                const z = bound * z / (l - 1) - bound / 2;
                const pos = vec3.fromValues(x, y, z);
                const mesh = createMesh(createCubeArray(size))
                const cube = createObject();
            }
        }
    }
}

function whenClicked(event){
    const ndc = getNDC(event);
    const od = getOriginAndDirection(ndc, hierarchy.camera);
    
    raycastHierarchy()
}

function createColorToCubeArray(color, level){

    const size = cubeArraySize;

    for(let x = 0; x < size; x++){
        for(let y = 0; y < size; y++){
            for(let z = 0; z < size; z++){
                array[x * size * size + y * size + z].mainColor = vec4.fromValues(x / size, y / size, z / size, 1);
            }
        }
    }



}


function scaleNearObject(origin){
    const nearObjectId = findNearObjects(origin);

    currNearCubes = [];
    for(let i = 0; i < nearObjectId.length; i++){
        currNearCubes.push(nearObjectId[i]);
    }

    // scale cubes does not included in prev
   for(let i = 0; i < currNearCubes.length; i++){   
        const included = prevNearCubes.includes(currNearCubes[i]);
        if(!included){
            prevNearCubes.push(currNearCubes[i]);
            const cube = origin.children.find(o => o.id === currNearCubes[i]);
            startObjectScaleAnim(cube, nearCubeScale, nearCubeScaleDuration);
        }
   }

   if(prevNearCubes.length > 0){
        for(let i = 0; i < prevNearCubes.length; i++){
            const included = currNearCubes.includes(prevNearCubes[i]);
            if(!included){
                const cube = origin.children.find(o => o.id === prevNearCubes[i]);
                startObjectScaleAnim(cube, vec3.fromValues(1, 1, 1), nearCubeScaleDuration);
                prevNearCubes.splice(i, 1);
            }
        }
   }

}

function startObjectScaleAnim(object, scale, duration){
    const start = vec3.clone(object.transform.scale);
    const end = vec3.clone(scale);
    let s = vec3.clone(start);
    let _time = 0;
    let t = 0, ease = 0;
    const scaleStop = startLoop((deltaTime, time) => {
        _time += deltaTime;
        t = _time / duration;
        ease = t * (2 - t);

        vec3.lerp(s, start, end, ease);
        object.transform.scale = vec3.clone(s);
        object.transform.update();

        if(t >= 1){
            scale = vec3.clone(end);
            object.transform.scale = vec3.clone(s);
            object.transform.update();
            scaleStop();
        }
    });
}

function findNearObjects(origin){
    const cam = hierarchy.camera.transform.position;
    const rMat = origin.transform.matrix;
    const objects = origin.children;

    let nearObjects = [];

    const l = objects.length;

    for(let i = 0; i < l; i++){
        const object = objects[i];
        const pos = object.transform.position;
        const wpos = vec3.create()
        vec3.transformMat4(wpos, pos, rMat);

        const dist = vec3.dist(wpos, cam);
        if(dist < nearCubeThreshold){
            nearObjects.push(object.id);
            
        }
    }

    return nearObjects;
    
}

function inertiaRotateorigin(deltaTime){
    
    quat.setAxisAngle(originQuatDelta, angularVelocityAxis, angularVelocity * deltaTime);
    quat.multiply(originQuat, originQuatDelta, originQuat);
    
    origin.transform.rotation.quat.set(originQuat);
    angularVelocity -= angularVelocityDeclineSpeed * deltaTime;
}

function rotateorigin(deltaTime){
//create screen space vector
    const p =  prevTouchPosition;
    const c =  currTouchPosition;
    const a = camera.aspect;
    const delta = vec4.fromValues(c[0] - p[0], c[1] - p[1], 0, 0);
    const delta2d = vec2.fromValues(delta[0] * a, delta[1]);
    
    const z90 = mat4.create();
    mat4.identity(z90);
    mat4.rotateZ(z90, z90, DegToRad(90));

    const NDCaxis = vec4.create();
    vec4.transformMat4(NDCaxis, delta, z90);


    //convert to world space

    const vp = camera.vp;
    const ivp = mat4.create();
    mat4.invert(ivp, vp);
    const wAxis4 = vec4.create();
    
    vec4.transformMat4(wAxis4, NDCaxis, ivp);
        
    angularVelocityAxis = vec3.fromValues(wAxis4[0], wAxis4[1], wAxis4[2]);
    vec3.normalize(angularVelocityAxis, angularVelocityAxis);
    //create Quaternion
    const angle = vec2.dist(vec2.fromValues(0, 0), delta2d);
    quat.setAxisAngle(originQuatDelta, angularVelocityAxis, angle);
    angularVelocity = angle / deltaTime;

    //apply quaternion
    if(angle > 0){
        
        quat.multiply(originQuat, originQuatDelta, originQuat);
        quat.normalize(originQuat, originQuat);
        origin.transform.rotation.quat.set(originQuat);
        origin.transform.update();
    }
    
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

function deleteTouchedObject(event){
    const ndc = getNDC(event);
    const od = getOriginAndDirection(ndc, camera);
    const hit = raycastHierarchy(od.origin, od.direction, hierarchy);
    if(hit){
        hit.object.isActive = false;
    }
}

function whenWheelMove(event){
    event.preventDefault();
    camera.transform.position[2] += event.deltaY * wheelMoveMultipier;
    camera.update();
}

function whenTouchStart(event){
    const ndc = getNDC(event)[0];
    firstTouchPosition = ndc;
    touchMoveDistance = 0;
    prevTouchPosition = ndc;
    currTouchPosition = ndc;
    

}

function whenTouchEnd(event){
    const ndcs = getNDC(event);
    const l = ndcs.length;
    const avg = vec3.create();

    isTouchMoving = true;

    currTouchPosition = ndcs[0];

    isTouchMoving = false;
}


function whenTouchMove(event){
    event.preventDefault();
    const ndcs = getNDC(event);
    const l = ndcs.length;

    isTouchMoving = true;
    


    currTouchPosition = ndcs[0];
    
}

function getTouchCount(event){
    return event.length;
}

function getNDC(event){
    if(event.touches){
        const ndcs = [];
        const rect = canvas.getBoundingClientRect();
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
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const ndc = vec3.fromValues(x / rect.width * 2 - 1, y / -rect.height * 2 + 1, -1);
        
        return ndc;
    }
    
}



function getOriginAndDirection(ndc, camera){

    const near = vec4.fromValues(ndc[0], ndc[1], ndc[2], 1);
    const far = vec4.fromValues(ndc[0], ndc[1], -ndc[2], 1);

    const invVP = mat4.create();
    mat4.invert(invVP, camera.vp);

    vec4.transformMat4(near, near, invVP);
    near[0] /= near[3];
    near[1] /= near[3];
    near[2] /= near[3];
    vec4.transformMat4(far, far, invVP);
    far[0] /= far[3];
    far[1] /= far[3];
    far[2] /= far[3];

    const dir = vec3.fromValues(far[0] - near[0], far[1] - near[1], far[2] - near[2]);
    vec3.normalize(dir, dir);

    return{
        origin: vec3.fromValues(near[0], near[1], near[2]),
        direction: dir
    }
    

}


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
    if(!object.isActive) return null;

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
            const a = collider.corners.a;
            const b = collider.corners.b;
            const s = collider.scale;
            vec3.scale(a, a, s);
            vec3.scale(b, b, s);
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

function createCubeObjectArray(origin = vec3.fromValues(0, 0, 0), num, size = 1, bound = 10, material){
    const cubeArray = [];
    const position = vec3.create();
    

    let id = 0;
    for(let x = 0; x < num; x++){
        for(let y = 0; y < num; y++){
            for(let z = 0; z < num; z++){
                const cube = createCubeObject(size, 1, material);
                const positionX = origin[0] + x / (num - 1) * bound - bound / 2;
                const positionY = origin[1] + y / (num - 1) * bound - bound / 2;
                const positionZ = origin[2] + z / (num - 1) * bound - bound / 2;
                
                
                cube.transform.position = vec3.fromValues(positionX, positionY, positionZ);
                cube.transform.scale = vec3.fromValues(1, 1, 1);
                cube.transform.update();
                
                cube.collider = createBoxCollider(1);
                
                cubeArray.push(cube);
            }
        }
    }

    return cubeArray;
}

function createCubeObject(size = 1, scale = 1, material = null){
    const cube = createObject(hierarchy);
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
        
        corners: {
            a: [-s, s, s],
            b: [ s, -s, -s]
        },
        
        scale: 1
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
    const displayWidth = Math.floor(canvas.clientWidth * dpr);
    const displayHeight = Math.floor(canvas.clientHeight * dpr);
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
    gl.clearColor(...backgroundColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function updateHierarchyTransform(hierarchy){
    const objects = hierarchy.objects;
    const camera = hierarchy.camera;
    
    camera.update();

    objects.forEach((o) => {
        updateObjectTransform(o);
    });
}

function updateObjectTransform(object){
    object.transform.update();
    if(object.children.length > 0){
        object.children.forEach((c) => updateObjectTransform(c));
    }
}
function createHierarchy(){
    const hierarcy = {
        camera : null,
        resolution : 1.0,
        objects: [],
        objectsIdCache: [],
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

    if(!object.isActive){
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

    gl.uniform4fv(material.uniforms.mainColorLoc, object.mainColor);


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

function createObject(hierarchy){
    const object = {
        isActive : true,
        transform : createTransform(),
        mesh : null,
        material : null,
        parent: null,
        children: [],
        id: null,
        collider: null,
        mainColor: vec4.fromValues(1, 1, 1, 1),

    }

    const cache = hierarchy.objectsIdCache;

    cache.push(cache.length - 1);
    object.id = cache[cache.length - 1];


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
            mainColorLoc : null,
            additional : []
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
    material.uniforms.mainColorLoc = gl.getUniformLocation(program, 'uMainColor');

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
            matrix: mat4.create(),
            quat: {
                angle : quat.create(),
                set : function(q){
                    this.angle = q;
                    mat4.identity(trs.rotation.matrix);
                    mat4.fromQuat(trs.rotation.matrix, q);
                },
            },
            euler: {
                angle : vec3.create(),
                set : function(e){
                    this.angle = e;
                    quat.fromEuler(trs.rotation.quat.angle, e[0], e[1], e[2]);
                    
                    mat4.identity(trs.rotation.matrix);
            
                    mat4.rotateX(trs.rotation.matrix, trs.rotation.matrix, e[0]);
                    mat4.rotateY(trs.rotation.matrix, trs.rotation.matrix, e[1]);
                    mat4.rotateZ(trs.rotation.matrix, trs.rotation.matrix, e[2]);
                },
            },
            
        },
        
        scale:     vec3.fromValues(...scale),

        matrix:    mat4.create(),

        world: mat4.create(),

        update(){
            mat4.identity(this.matrix);
            mat4.translate(this.matrix, this.matrix, this.position);
            mat4.multiply(this.matrix, this.matrix, this.rotation.matrix);
            mat4.scale(this.matrix, this.matrix, this.scale);
            return this.matrix;
        },
    };

    trs.update();
    return trs;
}