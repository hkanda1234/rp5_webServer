
//shader source
export const source = {
    vert : `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;
attribute float aIndex;

uniform mat4 uMVPMatrix;
uniform vec4 uMainColor;
uniform vec4 uMinColor;
uniform vec4 uMaxColor;
uniform float uEdgeThreshold;

varying vec3 vNormal;
varying vec2 vUV;
varying float vIndex;
varying vec4 vMainColor;
varying float lightness;
varying float vDepth;

varying vec4 vMinColor;
varying vec4 vMaxColor;

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
    vMinColor = uMinColor;
    vMaxColor = uMaxColor;
}
`,

    frag :`
precision mediump float;

varying vec3 vNormal;
varying vec2 vUV;
varying float vIndex;

varying vec4 vMainColor;
varying float lightness;

varying vec4 vMinColor;
varying vec4 vMaxColor;

void main(){
    float u = vUV[0];
    float v = vUV[1];
    float r, g, b, a;
    
    vec4 inv = vMainColor;
    vec3 nor = vNormal;

    vec4 col;
    float i = vIndex;

    float minR = vMinColor[0];
    float minG = vMinColor[1];
    float minB = vMinColor[2];

    float maxR = vMaxColor[0];
    float maxG = vMaxColor[1];
    float maxB = vMaxColor[2];

    float rangeR = maxR - minR;
    float rangeG = maxG - minG;
    float rangeB = maxB - minB;

    if(i == 0.0){
        col[0] = minR + u * rangeR;
        col[1] = minG + v * rangeG;
        col[2] = maxB;
    }

    if(i == 1.0){
        col[0] = maxR - u * rangeR;
        col[1] = minG + v * rangeG;
        col[2] = minB;
    }

    if(i == 2.0){
        col[0] = minR + u * rangeR;
        col[1] = maxG;
        col[2] = minB + u * rangeB;
    }

    if(i == 3.0){
        col[0] = minR + u * rangeR;
        col[1] = minG;
        col[2] = minB + u * rangeB;
    }

    if(i == 4.0){
        col[0] = minR;
        col[1] = minG + v * rangeG;
        col[2] = minB + u * rangeB;
    }  

    if(i == 5.0){
        col[0] = maxR;
        col[1] = minG + v * rangeG;
        col[2] = maxB - u * rangeB;
    }

    

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
`
}