precision highp float;

varying vec2 uv;

uniform sampler2D kernelTexture;
uniform sampler2D normalTexture;
uniform sampler2D backgroundTexture;

void main() {
    vec4 kernel = texture2D(kernelTexture, uv);
    if (kernel.a < 0.1) {
        discard;
    }
    vec3 ray = normalize(vec3(1,-1,1));
    vec4 normalColor = texture2D(normalTexture, uv);
    vec3 normal = normalize(normalColor.xyz);
    if (normalColor.z > .9) normal = vec3(0,0,1);
    gl_FragColor = vec4(max(0., dot(normal, ray))) * 0.8 + vec4(1) * 0.2;
    gl_FragColor.rgb *= 0.5;
    vec2 st = vec2(uv.x, 1. - uv.y);
    vec3 ray2 = refract(normal, vec3(0,0,-1), 0.5);
    st += ray2.xy * 0.1 / ray2.z;
    gl_FragColor += texture2D(backgroundTexture, st) * 0.5;
    gl_FragColor.rgb *= vec3(0.5, 0.7, 0.7);
}
