attribute vec2 pos;  //[0,1]
uniform float windowSize; //[px]
uniform float radius; //[px]
uniform vec2 center; //[px]
varying vec2 uv;

vec2 conv(vec2 px) {
    vec2 res = (px - windowSize * .5) / windowSize * 2.;
    res.y = -res.y;
    return res;
}

void main() {
    gl_Position = vec4(conv(center + radius * (pos - 0.5) * 2.), 0, 1);
    uv = pos;
}
