const canvas = document.createElement("canvas");
canvas.width = innerWidth;
canvas.height = innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
const particles = [];

const swapRow = (m, i, j) => {
    for (let k = 0; k < m.length; k++) {
        const tmp = m[i][k];
        m[i][k] = m[j][k];
        m[j][k] = tmp;
    }
}

const copy = m => {
    const ans = [];
    for (let i = 0; i < m.length; i++) {
        const ansi = [];
        for (let j = 0; j < m[i].length; j++) {
            ansi.push(m[i][j]);
        }
        ans.push(ansi);
    }
    return ans;
}

const printMatrix = m => {
    let str = "";
    m.forEach(mi => {
        mi.forEach(mij => {
            str += mij + ", ";
        });
        str += "\n";
    });
    console.log(str);
}

const hakidashi = m => {
    //printMatrix(m);
    for (let i = 0; i < m.length; i++) {
        let a = 0;
        for (let j = i; j < m.length; j++) {
            if (Math.abs(m[j][i]) > 1e-4 ) {
                a = m[j][i];
                if (i != j) {
                    swapRow(m, i, j);
                }
                break;
            }
        }
        if (a == 0) return -1;
        for (let j = i; j < m[i].length; j++) {
            m[i][j] /= a;
        }
        for (let j = 0; j < m.length; j++) {
            if (i == j) continue;
            const b = m[j][i];
            for (let k = i; k < m[j].length; k++) {
                m[j][k] -= b * m[i][k];
            }
        }
        //printMatrix(m);
    }
    return m;
};


const a = Math.random();
const b = Math.random();
const c = Math.random();
const d = -a -b-c;
const po = [
    [a,b,c,d],
    [b,a,d,c],
    [c,d,a,b],
    [d,c,b,a]
];

//console.log(hakidashi(copy(po)));

const env = {};

const init = particles => {
    env.dt = 0.016;
    env.nyu = 0.01;
    env.rho0 = 0.01;
    env.r = 4;
    env.re = 30;
    env.d = 2;
    env.n0 = average(particles.map(p => p.calcN(particles)));
    env.lambda = average(particles.map(p => p.calcLambda(particles)));
    env.particles = particles;
    particles.forEach(p => p.frc.y = 9.8);
};

const render = () => {
    requestAnimationFrame(render);
    particles.forEach(p => p.step(env));
    const m = particles.map(p => p.makeRow(env));
    const mLast = [1];
    for (let i = 0; i < particles.length; i++) mLast.push(0);
    m.push(mLast);
    hakidashi(m);
    for (let i = 0; i < particles.length; i++) {
        const mi = m[i];
        if (Math.abs(mi[i] - 1) < 1e-2) {
            particles[i].pressure = mi[mi.length-1];
        }
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
    o.calcN = particles => {
        return sum(particles.filter(p => p != o).map(p => weight(distance(o,p))));
    };
    o.calcLambda = (particles) => {
        const denom = o.calcN(particles);
        if (denom == 0) return 1;
        return sum(particles.map(p => distanceSq(o,p) * weight(distance(o,p)))) / denom;
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
    o.makeRow = env => {
        const row = env.particles.map(p => {
            if (p === o) return -sum(env.particles.map(p2 => weight(distance(o,p2))));
            else return weight(distance(o,p));
        });
        const n = sum(env.particles.filter(p => p != o).map(p => weight(p, o)));
        row.push(-env.rho0 * env.lambda * (n - env.n0) / (2 * env.d * env.dt * env.dt));
        return row;
    };
    o.updateDensity = (particles) => {
        o.density = o.calcDensity(particles);
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
        const x = 200 + i * 10;
        const y = 200 + j * 10;
        particles.push(makeParticle(x,y));
    }
}
init(particles);

requestAnimationFrame(render);
