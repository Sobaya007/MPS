precision lowp float;

varying vec2 uv;
uniform vec3 color;
uniform float isSurface;

void main() {
    float r = length(uv - 0.5);
    if (r > 0.5) discard;
    vec3 normal;
    normal.xy = uv * 2. - 1.;
    normal.z = 1. - length(normal.xy);
    gl_FragColor = vec4(normal * (0.5 - r), 1);
}
