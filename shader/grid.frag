void main() {
    const float WIDTH = 3.;
    gl_FragColor.a = 1.;
    vec2 p = vPosition.xy;
    float effect = 0.;
    for (int i = 0; i < 30; i++) {
        const float WAVE_SIZE = 0.1;
        vec2 origin = vec2(xs[i], ys[i]);
        float strength = exp(-rs[i] * 0.01);
        float d = length(p - origin) - rs[i];
        float e = strength * exp(-d * d * WAVE_SIZE);
        p += e * normalize(p - (origin + normalize(p-origin) * rs[i]));
        effect += e;
    }
    float po = min(
            abs(mod(p.x, WIDTH) - WIDTH * .5),
            abs(mod(p.y, WIDTH) - WIDTH * .5));
    gl_FragColor.rgb = vec3(po > 0.1 ? 0. : .5);
    gl_FragColor.gb -= vec2(effect);
}
