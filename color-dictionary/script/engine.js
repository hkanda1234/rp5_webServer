
import { vec2, vec3, vec4, mat4, quat } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";




export class GLCanvas {
    constructor(canvasElement){
        this.gl = canvasElement.getContext('webgl');
        this.canvas = canvasElement;
        this.scene = null;
        this.resolution = 1;
        this.dpr = window.devicePixelRatio || 1;
        this.width = Math.floor(this.canvas.clientWidth * this.dpr);
        this.height = Math.floor(this.canvas.clientHeight * this.dpr);
        
        this.aspect = this.width / this.height;
    }

    resizeToDisplaySize(){
        this.width = Math.floor(this.canvas.clientWidth * this.dpr);
        this.height = Math.floor(this.canvas.clientHeight * this.dpr);
        
        if(this.width != this.canvas.width || this.height != this.canvas.height){
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.aspect = this.width / this.height;
            return true;
        }
        
        return false;
    }

    clear(color){
        this.resizeToDisplaySize();

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(...color);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    renderScene(){

        if(!this.scene){
            console.error("no scene in canvas!");
            return;
        }

        this.scene.render(this.gl);

    }
}
//scene
export class Scene {
    constructor(gl) {
        this.gl = gl;
        this.camera = null;
        this.objects = [];
        this.objectIdCache = [];
        this.renderLoop = {
            id : null,
            isRunning : false,
            prevTime : null,
            currTime : null,
            deldaTime : null,
        }
    }

    startRender(){
        const self = this;
        this.renderLoop.isRunning = true;

        function frame(timeStamp){
            
            if(!self.renderLoop.isRunning) return;

            self.renderLoop.id = requestAnimationFrame(frame);
            console.log("render");

            self.renderLoop.currTime = timeStamp;
            self.renderLoop.deldaTime = 
            self.renderLoop.prevTime === null ? 0 :
            self.renderLoop.currTime - self.renderLoop.prevTime;

            try{
                render();
            } catch(error) {
                throw new Error("in Render Loop, ", error);
                self.stopRender();
            }

        }

        this.renderLoop.id = requestAnimationFrame(frame);

        
    }

    stopRender(){
        canselAnimationFrame(this.renderLoop.id);
        this.renderLoop.isRunning = false;
    }

    render(gl){
        for(const o in this.objects){
            o.render(gl);
        }
    }

    addObject(object){
        if(object){
            object.id = this.objectIdCache.length;
            this.objects.push(object);
            this.objectIdCache.push(object.id);
        }else{
            const o = new Object();
            o.id = this.objectIdCache.length;
            this.objects.push(o);
            
            this.objectIdCache.push(this.objectIdCache.length);
        }   
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
            o.updateTransform();
        });
    }


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

//object
export class CObject {
    constructor(){
        this.isActive = true;
        this.transform = new Transform();
        this.mesh = null;
        this.material = null;
        this.children = [];
        this.id = null;
        this.collider = null;
        this.mainColor = null;
    }

    render(gl, camera, parent = null){
        if(!this.isActive)return;
        

        let local = mat4.create();
        let world = mat4.create();
        mat4.copy(local, this.transform.localMatrix);
        if(parent){
            mat4.multiply(world, parent, local);
        } else {
            mat4.copy(world, this.transform.worldMatrix);
        }

        //render self
        if(this.mesh && this.material){

            gl.useProgram(this.material.program);
            const mesh = this.mesh;
            const buffer = mesh.buffer;
            const stride = mesh.stride;

            const pOffset = mesh.positionOffset;
            const nOffset = mesh.normOffset;
            const uvOffset = mesh.uvOffset;
            const iOffset = mesh.indexOffset;
            
            const vCount = mesh.vertCount;
            const triCount = vCount / 3;

            const projectionMat = camera.projectionMatrix;
            const mpMat = mat4.create();
            mat4.multiply(mpMat, world, projectionMat);

            const attribLoc = this.material.attribLoc;
            const positionLoc = attribLoc.position;
            const normalLoc = attribLoc.normal;
            const uvLoc = attribLoc.uv;
            const indexLoc = attribLoc.index;

            const uniformsLoc = this.material.uniformsLoc;
            const mvpLoc = uniformsLoc.mvp;
            const colLoc = uniformsLoc.mainColor;
            
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);

            gl.enableVertexAttribArray(positionLoc);
            gl.enableVertexAttribArray(normalLoc);
            gl.enableVertexAttribArray(uvLoc);
            gl.enableVertexAttribArray(indexLoc);

            gl.vertexAttribPointer(
                positionLoc,
                3,
                gl.FLOAT,
                false,
                stride,
                pOffset
            );

            gl.vertexAttribPointer(
                normalLoc,
                3,
                gl.FLOAT,
                false,
                stride,
                nOffset
            );

            gl.vertexAttribPointer(
                uvLoc,
                2,
                gl.FLOAT,
                false,
                stride,
                uvOffset
            );

            gl.vertexAttribPointer(
                indexLoc,
                1,
                gl.FLOAT,
                false,
                stride,
                iOffset
            );

            gl.uniformMatrix4fv(mvpLoc, false, mpMat);
            gl.uniform4fv(colLoc, false, this.mainColor);
            gl.enable(gl.DEPTH_TEST);
            gl.drawArrays(gl.TRIANGLES, 0, mesh.vertCount);



        }

        //render children
        if(this.children.length > 0){
            for(const c in this.children){
                c.render(gl, this.transform.worldMatrix);
            }
        }

        if(!this.mesh || !this.material){
            return;
        }
    }
    
    updateTransform(pMat = null){
        this.transform.updateMatrix();
        if(this.children.length > 0){
            this.children.forEach(c => {
                c.transform.updateMatrix(this.transform.worldMatrix);
            });
        }
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

    constructor(gl, program, attribLoc, uniformLoc){
        
        this.program = program,
        this.attribLoc = attribLoc,
        this.uniformsLoc = uniformLoc;

    }

    static create(gl, source){
        const vert = gl.createShader(gl.VERTEX_SHADER);
        const frag = gl.createShader(gl.FRAGMENT_SHADER);
        const program = gl.createProgram();

        //compile vert shader
        gl.shaderSource(vert, source.vert);
        gl.compileShader(vert);
        let success = gl.getShaderParameter(vert, gl.COMPILE_STATUS);
        if(!success){
            console.error(gl.getShaderInfoLog(vert));
            throw new Error("Failed to compile vert shader")
        }

        //compile frag shader
        gl.shaderSource(frag, source.frag);
        gl.compileShader(frag);
        success = gl.getShaderParameter(vert, gl.COMPILE_STATUS);
        if(!success){
            console.error(gl.getShaderInfoLog(frag));
            throw new Error("Failed to compile frag shader")
        }

        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if(!success){
            console.error(gl.getProgramParameter(program, gl.LINK_STATUS));
            gl.deleteProgram(program);
            throw new Error("Failed to link program");
        }

        const attribLoc = {
            position : gl.getAttribLocation(program, "aPosition"),
            normal   : gl.getAttribLocation(program, "aNormal"),
            uv       : gl.getAttribLocation(program, "aUV"),
            index    : gl.getAttribLocation(program, "aIndex"),
        }

        const uniformLoc = {
            mvp : gl.getUniformLocation(program, "uMVPMatrix"),
            mainColor : gl.getUniformLocation(program, "uMainColor"),
        }


        

        return new Material(gl, program, attribLoc, uniformLoc);

    }
}
//mesh
export class Mesh {

    constructor(gl, vertices){
        this.gl = gl;
        this.vertices = new Float32Array(vertices);
        this.buffer = null;
        this.attribNumPerVertex = 9;
        this.vertCount = vertices.length / this.attribNumPerVertex;
        this.stride = Float32Array.BYTES_PER_ELEMENT * 9;
        this.positionOffset = 0;
        this.normOffset = Float32Array.BYTES_PER_ELEMENT * 3;
        this.uvOffset = Float32Array.BYTES_PER_ELEMENT * 6;
        this.indexOffset = Float32Array.BYTES_PER_ELEMENT * 8;
        this.upload(this.gl, this.vertices)
    }

    upload(gl, vertices){

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    }

    static createCube(gl, size){
        const s = size / 2;
        const r = Math.PI / 2;
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
            [0, r * 2, 0],
            //top
            [-r, 0, 0],
            //bottom
            [r, 0, 0],
            //left
            [0, -r, 0],
            //right
            [0, r, 0],
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
        
        return new Mesh(gl, vertices);

    }
}

//transform
export class Transform {
    constructor(){
        this.position = vec3.fromValues(0, 0, 0);
        this.rotation = quat.create();
        this.scale = vec3.fromValues(1, 1, 1);
        this.rotationMatrix = mat4.create();
        this.localMatrix = mat4.create();
        this.worldMatrix = mat4.create();
        this.parentMatrix = null;
    }

    updateMatrix(parentMat){

        mat4.identity(this.localMatrix);

        mat4.translate(this.localMatrix, this.localMatrix, this.position);
        
        mat4.fromQuat(this.rotationMatrix, this.rotation);
        mat4.multiply(this.localMatrix, this.localMatrix, this.rotationMatrix);
        mat4.scale(this.localMatrix, this.localMatrix, this.scale);

        if(parentMat){
            mat4.multiply(this.worldMatrix, parentMat, this.localMatrix);
        }else{
            mat4.copy(this.worldMatrix, this.localMatrix);
        }
    }

    setPosition(x, y, z){
        vec3.set(this.position, x, y, z);
    }

    setRotation(x, y, z, w){
        quat.set(this.rotation, x, y, z, w);
        quat.normalize(this.rotation, this.rotation);
    }

    setEulerRotation(x, y, z){
        quat.fromEuler(this.rotation, x, y, z);
        quat.normalize(this.rotation, this.rotation);
    }

    setScale(scale){
        vec3.copy(this.scale, scale);
    }
}