const makeCalculator = () => {
    const o = {};

    // Place Particles
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 30; j++) {
            const x = 110 + i * env.l + env.l/2;
            const y = env.bottom - (j+1) * env.l;
            particles.push(makeParticle(x,y, "Water"));
        }
    }
    const po = Math.ceil(env.re / env.l) * 2;
    // Place Side Walls
    for (let y = env.top; y <= env.bottom; y += env.l) {
        inners.push(makeParticle(env.left, y, "InnerWall"));
        inners.push(makeParticle(env.right, y, "InnerWall"));
        for (let dx = env.l; dx <= env.l * po; dx += env.l) {
            outers.push(makeParticle(env.left - dx, y, "OuterWall"));
            outers.push(makeParticle(env.right + dx, y, "OuterWall"));
        }
    }
    // Place Bottom Walls
    for (let x = env.left+env.l; x < env.right; x += env.l) {
        inners.push(makeParticle(x, env.bottom, "InnerWall"));
    }
    for (let x = env.left-env.l * po; x <= env.right + env.l * po; x += env.l) {
        for (let dy = env.l; dy <= env.l * po; dy += env.l) {
            outers.push(makeParticle(x, env.bottom + dy, "OuterWall"));
        }
    }
    inners.forEach(p => grid.registerWall(p));
    outers.forEach(p => grid.registerWall(p));

    // Calc Environment Value
    env.n0 = particles.map(p => sum(particles.filter(p2 => p != p2).map(p2 => weight(p, p2)))).reduce((a,b) => a > b ? a : b);
    env.lambda = particles.map(p => sum(particles.filter(p2 => p != p2).map(p2 => distanceSq(p, p2) * weight(p, p2))) / sum(particles.filter(p2 => p != p2).map(p2 => weight(p, p2)))).reduce((a,b) => a > b ? a : b);

    o.step = () => {
        grid.clear();
        particles.forEach(p => grid.registerParticle(p));
        particles.forEach(p => p.prepareStep());
        particles.forEach(p => p.step());
        grid.clear();
        particles.forEach(p => grid.registerParticle(p));
        particles.forEach(p => p.prepareSolvePressure());
        inners.forEach(p => p.prepareSolvePressure());
        const candidates = particles.concat(inners).filter(p => !p.isSurface);
        for (let i = 0; i < env.iter; i++) {
            candidates.forEach(p => p.solvePressure());
        }
        particles.forEach(p => p.prepareStep2());
        particles.forEach(p => p.step2());
    };
    return o;
};
