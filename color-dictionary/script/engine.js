
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
        this.background = vec4.fromValues(1, 1, 1, 1);

        this.renderLoop = {
            id : null,
            isRunning : false,
            prevTime : null,
            currTime : null,
            deltaTime : null,
        };

        this.isTouchMoving = false;
        this.currTouchPos = null;
        this.prevTouchPos = null;
        this.deltaTouch = null;
        this.deltaVector = null;

    }

    
    startRender(){
        const self = this;
        this.renderLoop.isRunning = true;

        function frame(timeStamp){
            if(!self.renderLoop.isRunning) return;

            self.renderLoop.id = requestAnimationFrame(frame);

            self.renderLoop.currTime = timeStamp;
            self.renderLoop.deltaTime =
            self.renderLoop.prevTime === null ? 0 :
            self.renderLoop.currTime - self.renderLoop.prevTime;

            try{
                self.clear();
                self.render();
                
            } catch(error) {
                self.stopRender();
                throw new Error("in Render Loop: " + error);
            }

            self.renderLoop.prevTime = self.renderLoop.currTime;
        }

        this.renderLoop.id = requestAnimationFrame(frame);

        
    }

    stopRender(){
        cancelAnimationFrame(this.renderLoop.id);
        this.renderLoop.isRunning = false;
    }

    render(){
        
        if(!this.scene){
            console.error("no scene in canvas");
            if(this.renderLoop.isRunning){
                this.stopRender();
            }
            return;
        }
        this.scene.render();
    }

    
    clear(){
        this.resizeToDisplaySize();
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(...this.background);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    resizeToDisplaySize(){
        this.dpr = window.devicePixelRatio || 1;
        this.displayWidth = Math.floor(this.canvas.clientWidth * this.dpr);
        this.displayHeight = Math.floor(this.canvas.clientHeight * this.dpr);
        if(this.displayWidth != this.canvas.width || this.displayHeight != this.canvas.height){
            this.canvas.width = this.displayWidth * this.resolution;
            this.canvas.height = this.displayHeight * this.resolution;
            return true;
        }
        return false;
    }
}

export class Physic{
    constructor(scene){
        this.scene = scene;
        this.objects = scene.objects;
        this.camera = scene.camera;
        this.ray = {
            origin : vec3.create(),
            direction : vec3.create(),
        };
        this.invertMat = mat4.create();
        this.colliderType = {
            BOX : 1 << 0,
            SPHERE : 1 << 1,
        }
    }

    createBoxCollider(){
        const collider = {
            type : this.colliderType.BOX,
            value : null
        }


    }

    setRayfromNDC(ndc){
        this.ray.origin = vec3.clone(ndc);
        this.ray.direction = vec3.fromValues(this.ray.origin[0], this.ray.origin[1], this.ray.origin[2] + 1);
        this.camera.update();
        mat4.invert(this.invertMat, this.camera.projectionMatrix);

        vec3.transformMat4(this.ray.direction, this.ray.direction, this.invertMat);
        
        vec3.transformMat4(this.ray.origin, this.ray.origin, this.invertMat);

        vec3.subtract(this.ray.direction, this.ray.direction, this.ray.origin);
        vec3.normalize(this.ray.direction, this.ray.direction);
    }

    

}
//scene
export class Scene {
    constructor(gl) {
        this.gl = gl;
        this.camera = null;
        this.objects = [];
        this.objectIdCache = [];
        
        this.background = vec4.fromValues(1, 1, 1, 1);
    }

    render(){
        if(!this.camera)return;
        this.camera.update();
        this.updateObjectsTransform();
        for(const o of this.objects){
            o.render(this.gl, this.camera);
        }
    }

    add(object){
        if(object){
            this.objects.push(object);
            this.setIdToObject(object);
        }
    }

    setIdToObject(object){
        const children = object.children;
        object.id = this.objectIdCache.length;
        this.objectIdCache.push(object.id);
        if(children.length > 0){
            for(const child of children){
                this.setIdToObject(child);
            }
        }
    }

    updateObjectsTransform(){
        this.objects.forEach(o => {
            o.updateTransform();
        });
    }


}


export class Camera {
    constructor(
        canvas,
        fovY = Math.PI / 2,
        near = 0.01,
        far = 1000,
        aspect = null,
    )
    {
        this.canvas = canvas;
        this.transform = new Transform();
        this.fovY = fovY;
        this.near = near;
        this.far = far;
        this.aspect = aspect;

        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.persMatrix = mat4.create();
    }

    update(){
        this.aspect = this.canvas.width / this.canvas.height;
        
        mat4.perspective(
            this.persMatrix,
            this.fovY,
            this.aspect,
            this.near,
            this.far,
        );
        this.transform.updateMatrix();
        mat4.invert(this.viewMatrix, this.transform.worldMatrix);
        mat4.multiply(this.projectionMatrix, this.persMatrix, this.viewMatrix);
        
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
        this.mainColor = vec4.fromValues(1, 1, 1, 1);
        this._mpMat = mat4.create();
    }

    render(gl, camera, parent = null){
        if(!this.isActive)return;
        
        const world = this.transform.worldMatrix;
        
        //render self
        if(this.mesh && this.material){
            
            gl.useProgram(this.material.shader.program);
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
            mat4.multiply(this._mpMat, projectionMat, world);
            
            const attribLoc = this.material.shader.attribLoc;
            const positionLoc = attribLoc.position;
            const normalLoc = attribLoc.normal;
            const uvLoc = attribLoc.uv;
            const indexLoc = attribLoc.index;

            const uniformsLoc = this.material.shader.uniformsLoc;
            const mvpLoc = uniformsLoc.mvp;
            const colLoc = uniformsLoc.mainColor;
            
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);

            if(positionLoc >= 0){
                gl.enableVertexAttribArray(positionLoc);
                gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, stride, pOffset);
            }
            if(normalLoc >= 0){
                gl.enableVertexAttribArray(normalLoc);
                gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, stride, nOffset);
            }
            if(uvLoc >= 0){
                gl.enableVertexAttribArray(uvLoc);
                gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, stride, uvOffset);
            }
            if(indexLoc >= 0){
                gl.enableVertexAttribArray(indexLoc);
                gl.vertexAttribPointer(indexLoc, 1, gl.FLOAT, false, stride, iOffset);
            }

            gl.uniformMatrix4fv(mvpLoc, false, this._mpMat);
            gl.uniform4fv(colLoc, this.mainColor);

            for(const u of this.material.uniform4fv){
                gl.uniform4fv(u.location, u.value);
            }

            gl.enable(gl.DEPTH_TEST);
            gl.drawArrays(gl.TRIANGLES, 0, mesh.vertCount);



        }

        //render children
        if(this.children.length > 0){
            for(const c of this.children){
                c.render(gl, camera, world);
            }
        }

        if(!this.mesh || !this.material){
            return;
        }
    }
    
    updateTransform(pMat = null){
        this.transform.updateMatrix(pMat);
        if(this.children.length > 0){
            for(const c of this.children){
                c.updateTransform(this.transform.worldMatrix);
            }
        }
    }
}

export class Material {
    constructor(gl, shader){
        this.gl = gl;
        this.shader = shader;
        this.uniform4fv = [];
    }

    addVec4Uniform(name, value){
        const location = this.gl.getUniformLocation(this.shader.program, name)
        if(!location){
            console.error("shader program doesn't contain uniform named " + name);
            return null;
        }
        this.uniform4fv.push({
            location : location,
            value : value,
        });
        return true;
    }

    static createFromSource(gl, source){
        const shader = Shader.create(gl, source);
        return new Material(gl, shader);
    }

    copy(){
        const copy = new Material(this.gl, this.shader);
        
        for(const u of this.uniform4fv){
            copy.uniform4fv.push({
                location : u.location,
                value : vec4.clone(u.value),
            });
        }
        
        return copy;
    }
}
//shader
export class Shader {

    constructor(gl, program, attribLoc, uniformLoc){
        this.program = program;
        this.attribLoc = attribLoc;
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
        success = gl.getShaderParameter(frag, gl.COMPILE_STATUS);
        if(!success){
            console.error(gl.getShaderInfoLog(frag));
            throw new Error("Failed to compile frag shader")
        }

        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if(!success){
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            gl.deleteShader(vert);
            gl.deleteShader(frag);
            throw new Error("Failed to link program");
        }
        gl.detachShader(program, vert);
        gl.detachShader(program, frag);
        gl.deleteShader(vert);
        gl.deleteShader(frag);

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


        

        return new Shader(gl, program, attribLoc, uniformLoc);

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
        const indices = [0, 1, 2, 2, 1, 3];

        for(let i = 0; i < 6; i++){
            const rot = rotations[i];
            let mat = mat4.create();
            mat4.rotateX(mat, mat, rot[0]);
            mat4.rotateY(mat, mat, rot[1]);
            mat4.rotateZ(mat, mat, rot[2]);

            for(let j = 0; j < 6; j++){
                let corner = frontCorners[indices[j]];
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

    setScale(x, y, z){
        vec3.set(this.scale, x, y, z);
    }
}