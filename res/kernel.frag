precision lowp float;

varying vec2 uv;
uniform vec3 color;
uniform float isSurface;

void main() {
    float r = length(uv - 0.5);
    if (r > 0.5) discard;
    gl_FragColor = vec4(1,0,0,(0.5 - r) * 0.5);
}
