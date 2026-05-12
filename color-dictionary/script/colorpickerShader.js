
//shader source
export const source = {
    vert : `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;
attribute float aIndex;

uniform mat4 uMVPMatrix;
uniform vec4 uMainColor;
uniform vec3 uMinColor;
uniform vec3 uMaxColor;

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
`,

    frag :`
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

    
    
    gl_FragColor = vec4(u, v, b, a);
}
`
}