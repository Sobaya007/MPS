const makeParticle = (x,y) => {
    const o = {
        pos: {x:x, y:y},
        vel: {x:0, y:0},
        frc: {x:0, y:env.g},
        pressure: 0,
        laplacianVel: {x:0, y:0},
        gradientPressure: {x:0, y:0}
    };
    o.checkVel = () => {
        const v = length(o.vel);
        if (v > env.lv) {
            o.vel.x *= env.lv / v;
            o.vel.y *= env.lv / v;
        }
    };
    o.prepareStep = () => {
        const nears = grid.getNears(o);
        o.laplacianVel.x = 2 * env.d / env.lambda / env.n0 * sum(nears.map(p => (p.vel.x - o.vel.x) * weight(o,p)));
        o.laplacianVel.y = 2 * env.d / env.lambda / env.n0 * sum(nears.map(p => (p.vel.y - o.vel.y) * weight(o,p)));
    }
    o.step = () => {
        o.vel.x += env.dt * (env.nu * o.laplacianVel.x + o.frc.x);
        o.vel.y += env.dt * (env.nu * o.laplacianVel.y + o.frc.y);
        o.checkVel();
        o.pos.x += env.dt * o.vel.x;
        o.pos.y += env.dt * o.vel.y;
    };
    o.prepareSolvePressure = () => {
        const nears = grid.getNears(o);
        o.weights = nears.map(p => {return {p:p,w:weight(o,p)};});
        o.n = sum(nears.map(p => weight(o,p)));
        o.c = -env.alpha * env.rho0 * (o.n - env.n0) * env.lambda * env.n0 / (env.dt * env.dt * env.n0 * 2 * env.d);
        o.isSurface = o.n < env.beta * env.n0;
        if (o.isSurface) {
            o.pressure = 0;
        }
    };
    o.solvePressure = () => {
        const b = sum(o.weights.map(w => w.p.pressure * w.w));
        o.pressure = Math.min(5, (b - o.c) / o.n);
    };
    o.prepareStep2 = () => {
        const nears = grid.getNears(o);
        let minP = o.pressure;
        if (nears.length > 0)
            minP = Math.min(nears.map(p => p.pressure).reduce((a,b) => a < b ? a : b));

        o.gradientPressure.x = env.d / env.n0 * sum(nears.map(p => (p.pressure - minP) / distanceSq(o,p) * (p.pos.x - o.pos.x) * weight(o,p)));
        o.gradientPressure.y = env.d / env.n0 * sum(nears.map(p => (p.pressure - minP) / distanceSq(o,p) * (p.pos.y - o.pos.y) * weight(o,p)));
    };
    o.step2 = () => {
        const vx = o.vel.x;
        const vy = o.vel.y;
        const fixVelX = -env.dt * o.gradientPressure.x / env.rho0;
        const fixVelY = -env.dt * o.gradientPressure.y / env.rho0;
        o.vel.x += fixVelX;
        o.vel.y += fixVelY;
        o.checkVel();
        o.pos.x += env.dt * (o.vel.x - vx);
        o.pos.y += env.dt * (o.vel.y - vy);
    };
    o.render = (prog) => {
        gl.useProgram(prog);
        Bar.uniforms(prog, {
            center : [o.pos.x, o.pos.y]
        });
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    return o;
};

const weight = (p,p2) => {
    const r = distance(p,p2);
    if (r == 0) return 0;
    if (r < env.re) return env.re / r - 1;
    return 0;
};

const length = v => Math.sqrt(lengthSq(v));

const lengthSq = v => v.x * v.x + v.y * v.y;

const distanceSq = (a,b) =>
    lengthSq({
        x: a.pos.x - b.pos.x,
        y: a.pos.y - b.pos.y
    });

const distance = (a,b) => Math.sqrt(distanceSq(a,b));

const sum = arr => arr.reduce((a,b) => a + b, 0);

const average = arr => sum(arr) / arr.length;

