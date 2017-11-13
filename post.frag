precision lowp float;

varying vec2 uv;

uniform sampler2D kernelTexture;
uniform sampler2D normalTexture;
uniform float isSurface;

void main() {
    vec4 kernel = texture2D(kernelTexture, uv);
    if (kernel.a < 0.1) discard;
    vec4 normal = texture2D(normalTexture, uv);
    gl_FragColor = vec4(normalize(normal.xyz) * .5 + .5, 1);
}
