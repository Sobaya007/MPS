precision lowp float;

varying vec2 uv;
uniform vec3 color;

void main() {
    if (length(uv - 0.5) > 0.5) discard;
    gl_FragColor = vec4(color,1);
}
