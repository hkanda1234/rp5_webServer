const { mat4, vec3 } = glMatrix;


const canvas = document.querySelector('#colorPickerCanvas');
const gl = canvas.getContext('webgl');

if(!gl){
    alert("WebGL is not supported by your brouser.");
    throw new Error("WebGL is not supported by your browser");
}

function resizeCanvasToDisplaySize(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(canvas.clientWidth * dpr);
    const displayHeight = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== displayWidth || canvas.height != displayHeight){
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        return true;
    }
    return false;
}
const vertexShaderSource = `
attribute vec3 aPosition;
attribute vec2 aUV;

uniform mat4 uMVPMatrix;

varying vec2 vUV;
void main(){
    gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
    
    vUV = aUV;
}
`;

const fragmentShaderSource = `
precision mediump float;

varying vec2 vUV;
void main(){
    gl_FragColor = vec4(vUV[0], 0.0, vUV[1], 1.0);
}
`;


function transformCorner(corner, mat){
    const position = vec3.fromValues(corner[0], corner[1], corner[2]);
    vec3.transformMat4(position, position, mat);
    return [
        position[0],
        position[1],
        position[2],
        corner[3], corner[4],
    ];
}

function createCubeFaces(size = 1.0){
    const s = size / 2;

    const frontCorners = [ 
                [-s, -s, s, 0.0, 1.0],
                [-s, s, s, 0.0, 0.0],
                [s, s, s, 1.0, 0.0],
                [s, -s, s, 1.0, 1.0],
            ];
    const faceTransforms = [
        { name: "front", rotate: [0, 0, 0]},
        { name: "back",  rotate: [0, Math.PI, 0]},
        { name: "top",   rotate: [-Math.PI / 2, 0, 0]},
        { name: "bottom",rotate: [Math.PI / 2, 0, 0]},
        { name: "left",  rotate: [0, -Math.PI / 2, 0]},
        { name: "right", rotate: [0, Math.PI / 2, 0]},
    ];

    return faceTransforms.map( face => {
        const mat = mat4.create();

        mat4.rotateX(mat, mat, face.rotate[0]);
        mat4.rotateY(mat, mat, face.rotate[1]);
        mat4.rotateZ(mat, mat, face.rotate[2]);

        return{
            name: face.name,
            corners: frontCorners.map(corner => transformCorner(corner, mat))
        }
    });
}

function createTRS(translate, rotation, scale){
    const trs = {
        translate: translate,
        rotation: rotation,
        scale: scale
    };
    return trs;
}

function getAspect(){
    return window.innerWidth / window.innerHeight;
}

function createMVPMatrix(trs, aspect, fovy){
    const m = mat4.create();
    const p = mat4.create();
    const mvp = mat4.create();


    mat4.identity(m);
    mat4.translate(m, m, trs.translate);
    mat4.rotateX(m, m, trs.rotation[0]);
    mat4.rotateY(m, m, trs.rotation[1]);
    mat4.rotateZ(m, m, trs.rotation[2]);
    mat4.scale(m, m, [trs.scale[0], trs.scale[1], trs.scale[2]]);

    mat4.perspective(
        p,
        fovy,
        aspect,
        0.1,
        100.0
    );

    console.log(mvp, p, m);
    mat4.multiply(mvp, p, m);
    
    return mvp;
}

function createShader(gl, type, source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if(!success){
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw new Error("shader compile failed");
    }
    return shader;
}

function createProgram(gl, vertexShaderSource, fragmentShaderSource){
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(!success){
        console.error(gl.getProgramInfoLog(program, gl.LINK_STATUS));
        gl.deleteProgram(program);
        throw new Error("program link failed");
    }
    return program;
}

function render(){
    resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    clearColorPicker();

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    //create cube vertices
    const cube = createCubeFaces(1.0);
    let data = [];
    let triLength = 0;

    cube.forEach( face => {
        const [a, b, c, d] = face.corners;
        data.push(...a);
        data.push(...b);
        data.push(...c);

        data.push(...a);
        data.push(...c);
        data.push(...d);

        triLength += 2;
    });
    console.log(data.length);
    console.log(triLength);
    const vertices = new Float32Array(data);

    const translate = vec3.fromValues(0.0, 0.0, -2.0);
    const rotation = vec3.fromValues(Math.PI / 4, Math.PI / 4, 0);
    const scale = vec3.fromValues(1, 1, 1);

    const trs = createTRS(translate, rotation, scale);
    console.log(trs);
    console.log(translate);

    const mvpMatrix = createMVPMatrix(trs, getAspect(), Math.PI / 2);
    console.log(mvpMatrix);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    const stride = 5 * Float32Array.BYTES_PER_ELEMENT;
    const positionOffset = 0;
    const uvOffset = 3 * Float32Array.BYTES_PER_ELEMENT;

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        3,
        gl.FLOAT,
        false,
        stride,
        positionOffset
    );

    const uvLocation = gl.getAttribLocation(program, "aUV");
    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(
        uvLocation,
        2,
        gl.FLOAT,
        false,
        stride,
        uvOffset
    );

    const mvpLocation = gl.getUniformLocation(program, "uMVPMatrix");
    gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 5);
}

render();

function clearColorPicker(){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}