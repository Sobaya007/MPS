const canvas = document.createElement("canvas");
canvas.width = innerWidth;
canvas.height = innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

const env = {
    dt : 1,
    nyu : 0,
    rho0 : 1,
    r : 4,
    re : 14,
    d : 2,
    alpha : 0.1,
    beta : 0.97,
    l : 10,
    g : 0.01,
    iter : 20,
    lv : 30,
    left : 100,
    right : 300,
    bottom : 500
};

const init = particles => {
    env.n0 = particles.map(p => sum(particles.filter(p2 => p != p2).map(p2 => weight(p, p2)))).reduce((a,b) => a > b ? a : b);
    env.lambda = particles.map(p => sum(particles.filter(p2 => p != p2).map(p2 => distanceSq(p, p2) * weight(p, p2))) / sum(particles.filter(p2 => p != p2).map(p2 => weight(p, p2)))).reduce((a,b) => a > b ? a : b);
    particles.forEach(p => p.frc.y = env.g);
};

const render = () => {
    requestAnimationFrame(render);
    for (let k = 0; k < 3; k++) {
        particles.forEach(p => p.step(env, particleAndInnerAndOuters));
        particleAndInners.forEach(p => p.prepare());
        const candidates = particleAndInners.filter(p => !p.isSurface);
        for (let i = 0; i < env.iter; i++) {
            candidates.forEach(p => p.solvePressure(env, particleAndInnerAndOuters));
        }
        particles.forEach(p => p.step2(env, particleAndInnerAndOuters));
    }
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,20000,20000);
    particleAndInnerAndOuters.forEach(p => p.render(ctx));
    const render2 = (x,y,t) => {
        t *= Math.PI * 2;
        const r = Math.floor((Math.sin(t) * .5 + .5) * 255);
        const g = Math.floor((Math.sin(t + Math.PI * 2 / 3) * .5 + .5) * 255);
        const b = Math.floor((Math.sin(t - Math.PI * 2 / 3) * .5 + .5) * 255);
        ctx.fillStyle = "rgb(" + r + ", " + g + ", " + b + ")";
        ctx.beginPath();
        ctx.arc(x, y, env.r, 0, 2 * Math.PI, true);
        ctx.fill();
    };
    for (let i = 0; i < 255; i++) {
        render2(10,10 + i*3, i / 255);
    }
};

const weight = (p,p2) => {
    const r = distance(p,p2);
    if (r == 0) return 0;
    if (r < env.re) return env.re / r - 1;
    return 0;
};

const distanceSq = (a,b) => {
    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    return dx * dx + dy * dy;
};

const distance = (a,b) => Math.sqrt(distanceSq(a,b));

const sum = arr => arr.reduce((a,b) => a + b, 0);

const average = arr => sum(arr) / arr.length;

const makeParticle = (x,y) => {
    const o = {
        pos: {x:x, y:y},
        vel: {x:0, y:0},
        frc: {x:0, y:0},
        pressure: 0,
        type : "Particle"
    };
    o.checkVel = () => {
        const v = Math.sqrt(o.vel.x * o.vel.x + o.vel.y * o.vel.y);
        if (v > env.lv) {
            o.vel.x *= env.lv / v;
            o.vel.y *= env.lv / v;
        }
    };
    o.step = (env, particles) => {
        const ps = particles.filter(p => p != o);
        const laplacianVelX = 2 * env.d / env.lambda / env.n0 * sum(ps.map(p => (p.vel.x - o.vel.x) * weight(o,p)));
        const laplacianVelY = 2 * env.d / env.lambda / env.n0 * sum(ps.map(p => (p.vel.y - o.vel.y) * weight(o,p)));
        o.vel.x += env.dt * (env.nyu * laplacianVelX + o.frc.x);
        o.vel.y += env.dt * (env.nyu * laplacianVelY + o.frc.y);
        o.checkVel();
        o.pos.x += env.dt * o.vel.x;
        o.pos.y += env.dt * o.vel.y;
    };
    o.prepare = () => {
        o.nears = particleAndInners.filter(p => p != o).filter(p => distance(o,p) <= env.re);
        o.weights = o.nears.map(p => {return {p:p,w:weight(o,p)};});
        o.n = sum(o.nears.map(p => weight(o,p)));
        o.a = -2 * env.d / (env.lambda * env.n0) * o.n;
        o.c = -env.alpha * env.rho0 * (o.n - env.n0) / (env.dt * env.dt * env.n0);
        o.isSurface = o.n < env.beta * env.n0;
        if (o.isSurface) {
            o.pressure = 0;
        }
    };
    o.solvePressure = (env, particles) => {
        // ap + b = c
        const b = +2 * env.d / (env.lambda * env.n0) * sum(o.weights.map(w => w.p.pressure * w.w));
        o.pressure = (o.c - b) / o.a;
    };
    o.step2 = (env) => {
        const ps = particleAndInners.filter(p => p != o);
        const minP = particleAndInners.filter(p => distance(o,p) < env.re).map(p => p.pressure).reduce((a,b) => a < b ? a : b);
        const gradPressureX = env.d / env.n0 * sum(ps.map(p => (p.pressure - minP) / distanceSq(o,p) * (p.pos.x - o.pos.x) * weight(o,p)));
        const gradPressureY = env.d / env.n0 * sum(ps.map(p => (p.pressure - minP) / distanceSq(o,p) * (p.pos.y - o.pos.y) * weight(o,p)));
        const vx = o.vel.x;
        const vy = o.vel.y;
        const fixVelX = -env.dt * gradPressureX / env.rho0;
        const fixVelY = -env.dt * gradPressureY / env.rho0;
        o.vel.x += fixVelX;
        o.vel.y += fixVelY;
        o.checkVel();
        o.pos.x += env.dt * (o.vel.x - vx);
        o.pos.y += env.dt * (o.vel.y - vy);
    };
    o.render = ctx => {
        const t = (o.pressure / 40 + 20) * 2 * Math.PI;
        const r = Math.floor((Math.sin(t) * .5 + .5) * 255);
        const g = Math.floor((Math.sin(t + Math.PI * 2 / 3) * .5 + .5) * 255);
        const b = Math.floor((Math.sin(t - Math.PI * 2 / 3) * .5 + .5) * 255);
        ctx.fillStyle = "rgb(" + r + ", " + g + ", " + b + ")";
        ctx.beginPath();
        ctx.arc(o.pos.x, o.pos.y, env.r, 0, 2 * Math.PI, true);
        ctx.fill();
    };
    return o;
};

const makeInnerWall = (x,y) => {
    const o = {
        pos: {x:x, y:y},
        vel: {x:0, y:0},
        frc: {x:0, y:0},
        pressure: 0,
        type : "InnerWall"
    };
    o.prepare = () => {
        o.nears = particleAndInners.filter(p => p != o).filter(p => distance(o,p) <= env.re);
        o.weights = o.nears.map(p => {return {p:p,w:weight(o,p)};});
        o.n = sum(o.nears.map(p => weight(o,p)));
        o.a = -2 * env.d / (env.lambda * env.n0) * o.n;
        o.c = -env.alpha * env.rho0 * (o.n - env.n0) / (env.dt * env.dt * env.n0);
        o.isSurface = o.n < env.beta * env.n0;
        if (o.isSurface) {
            o.pressure = 0;
        }
    };
    o.solvePressure = (env, particles) => {
        // ap + b = c
        const b = +2 * env.d / (env.lambda * env.n0) * sum(o.weights.map(w => w.p.pressure * w.w));
        o.pressure = (o.c - b) / o.a;
    };
    o.render = ctx => {
        const t = (o.pressure / 40 + 20) * 2 * Math.PI;
        const r = Math.floor((Math.sin(t) * .5 + .5) * 255);
        const g = Math.floor((Math.sin(t + Math.PI * 2 / 3) * .5 + .5) * 255);
        const b = Math.floor((Math.sin(t - Math.PI * 2 / 3) * .5 + .5) * 255);
        ctx.fillStyle = "rgb(" + r + ", " + g + ", " + b + ")";
        ctx.beginPath();
        ctx.arc(o.pos.x, o.pos.y, env.r, 0, 2 * Math.PI, true);
        ctx.fill();
    };
    return o;
};

const makeOuterWall = (x,y) => {
    const o = {
        pos: {x:x, y:y},
        vel: {x:0, y:0},
        frc: {x:0, y:0},
        pressure: 0,
        type : "OuterWall"
    };
    o.render = ctx => {
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(o.pos.x, o.pos.y, env.r, 0, 2 * Math.PI, true);
        ctx.fill();
    };
    return o;
};

const particles = [];
const bn = 3;
for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
        const x = 250 + i * env.l + env.l/2;
        const y = 150 + j * env.l;
        //particles.push(makeParticle(x,y));
        //particles[particles.length-1].vel.x = 3;
    }
}
for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 20; j++) {
        const x = 150 + i * env.l + env.l/2;
        const y = env.bottom - (j+1) * env.l;
        particles.push(makeParticle(x,y));
        //particles[particles.length-1].vel.x = 3;
    }
}
const inners = [];
const outers = [];
const po = Math.ceil(env.re / env.l) * 2;
for (let y = 300; y <= env.bottom; y += env.l/1.1) {
    inners.push(makeInnerWall(env.left, y));
    inners.push(makeInnerWall(env.right, y));
    for (let dx = env.l; dx <= env.l * po; dx += env.l/1.1) {
        outers.push(makeOuterWall(env.left - dx, y));
        outers.push(makeOuterWall(env.right + dx, y));
    }
}
for (let x = env.left+env.l; x < env.right; x += env.l/1.1) {
    inners.push(makeInnerWall(x, env.bottom));
}
for (let x = env.left-env.l * po; x <= env.right + env.l * po; x += env.l/1.1) {
    for (let dy = env.l; dy <= env.l * po; dy += env.l/1.1) {
        outers.push(makeOuterWall(x, env.bottom + dy));
    }
}
const particleAndInners = [];
particles.forEach(p => particleAndInners.push(p));
inners.forEach(p => particleAndInners.push(p));
const particleAndInnerAndOuters = [];
particleAndInners.forEach(p => particleAndInnerAndOuters.push(p));
outers.forEach(p => particleAndInnerAndOuters.push(p));
init(particles);

requestAnimationFrame(render);

window.addEventListener("keydown", render);
