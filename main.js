const canvas = document.createElement("canvas");
canvas.width = innerWidth;
canvas.height = innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
const particles = [];

const env = {
    dt : 1,
    nyu : 0,
    rho0 : 1,
    r : 4,
    re : 10,
    d : 2,
    alpha : 0.5,
    l : 8,
    g : 0,
    iter : 100
};

const init = particles => {
    env.n0 = particles.map(p => sum(particles.filter(p2 => p != p2).map(p2 => weight(distance(p, p2))))).reduce((a,b) => a > b ? a : b);
    env.lambda = particles.map(p => sum(particles.filter(p2 => p != p2).map(p2 => distanceSq(p, p2) * weight(distance(p, p2)))) / sum(particles.filter(p2 => p != p2).map(p2 => weight(distance(p, p2))))).reduce((a,b) => a > b ? a : b);
    env.particles = particles;
    particles.forEach(p => p.frc.y = env.g);
};

const render = () => {
    requestAnimationFrame(render);
    //particles.forEach(p => p.step(env));
    particles.forEach(p => p.pressure = 0);
    for (let i = 0; i < env.iter; i++) {
        particles.forEach(p => p.solvePressure(env));
    }
    particles.forEach(p => p.step2(env));

    ctx.fillStyle = "black";
    ctx.fillRect(0,0,20000,20000);
    particles.forEach(p => p.render(ctx));
};

const weight = r => {
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
        density: 0,
        pressure: 0,
        near : []
    };
    o.checkWall = () => {
        if (o.pos.x < 100) {
            o.pos.x = 100;
            if (o.vel.x < 0) o.vel.x = -o.vel.x;
        }
        if (o.pos.y < 100) {
            o.pos.y = 100;
            if (o.vel.y < 0) o.vel.y = -o.vel.y;
        }
        if (o.pos.x > 500) {
            o.pos.x = 500;
            if (o.vel.x > 0) o.vel.x = -o.vel.x;
        }
        if (o.pos.y > 500) {
            o.pos.y = 500;
            if (o.vel.y > 0) o.vel.y = -o.vel.y;
        }
    };
    o.step = (env) => {
        const laplacianVelX = 2 * env.d / env.lambda / env.n0 * sum(env.particles.map(p => (p.vel.x - o.vel.x) * weight(distance(o,p))));
        const laplacianVelY = 2 * env.d / env.lambda / env.n0 * sum(env.particles.map(p => (p.vel.y - o.vel.y) * weight(distance(o,p))));
        o.vel = {
            x: o.vel.x + env.dt * (env.nyu * laplacianVelX + o.frc.x),
            y: o.vel.y + env.dt * (env.nyu * laplacianVelY + o.frc.y),
        };
        o.pos = {
            x: o.pos.x + env.dt * o.vel.x,
            y: o.pos.y + env.dt * o.vel.y
        };
        o.checkWall();
    };
    o.solvePressure = (env) => {
        const n = sum(env.particles.filter(p => p != o).map(p => weight(distance(o,p))));
        if (n == 0) {
            o.pressure = 0;
            return;
        }
        o.pressure = (sum(env.particles.filter(p => p != o).map(p => p.pressure * weight(distance(o,p)))) + env.alpha * env.rho0 * env.lambda * (n - env.n0) / (2 * env.d * env.dt * env.dt)) / n;
    };
    o.step2 = (env) => {
        const gradPressureX = env.d / env.n0 * sum(env.particles.filter(p => p != o).map(p => (p.pressure - o.pressure) / distanceSq(o,p) * (p.pos.x - o.pos.x) * weight(distance(o,p))));
        const gradPressureY = env.d / env.n0 * sum(env.particles.filter(p => p != o).map(p => (p.pressure - o.pressure) / distanceSq(o,p) * (p.pos.y - o.pos.y) * weight(distance(o,p))));
        const fixVelX = -env.dt * gradPressureX / env.rho0;
        const fixVelY = -env.dt * gradPressureY / env.rho0;
        o.vel.x += fixVelX;
        o.vel.y += fixVelY;
        o.pos.x += env.dt * fixVelX;
        o.pos.y += env.dt * fixVelY;
        o.checkWall();
    };
    o.render = ctx => {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(o.pos.x, o.pos.y, env.r, 0, 2 * Math.PI, true);
        ctx.fill();
    };
    return o;
};

for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
        const x = 200 + i * env.l;
        const y = 200 + j * env.l;
        particles.push(makeParticle(x,y));
    }
}
init(particles);

requestAnimationFrame(render);
