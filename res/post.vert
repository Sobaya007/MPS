attribute vec2 pos;

varying vec2 uv;

void main() {
    gl_Position = vec4(pos * 2. - 1., 0, 1);
    uv = pos;
}
