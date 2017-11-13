const env = {
    dt : 1,
    nu : 0.3,
    rho0 : 1,
    r : 20,
    re : 14,
    d : 2,
    alpha : 0.05,
    beta : 0.97,
    l : 10,
    g : 0.01,
    iter : 10,
    lv : 3,
    left : 100,
    right : 500,
    top : 300,
    bottom : 600,
    virtualWindowSize : 700
};
let particles = [];
const inners = [];
const outers = [];
const grid = makeGrid();
const calculator = makeCalculator();
let isPressed = false;
let beforePos;

Bar.setOnMouseDown(mousePos => {
    isPressed = true;
    const pos = {
        x : (mousePos.x + 1) / 2 * env.virtualWindowSize,
        y : (mousePos.y + 1) / 2 * env.virtualWindowSize,
    };
    beforePos = pos;
});
Bar.setOnMouseUp(mousePos => {
    isPressed = false;
});

Bar.setOnMouseMove(mousePos => {
    if (!isPressed) return;
    const pos = {
        x : (mousePos.x + 1) / 2 * env.virtualWindowSize,
        y : (mousePos.y + 1) / 2 * env.virtualWindowSize,
    };
    const d = {
        x: pos.x - beforePos.x,
        y: pos.y - beforePos.y,
    };
    particles.filter(p => length({x:pos.x - p.pos.x, y:pos.y - p.pos.y}) < 10).forEach(p => {
        p.vel.x += d.x * 0.05;
        p.vel.y += d.y * 0.05;
    });
});

prepareRendering().then(render => {
    const frame = () => {
        for (let i = 0; i < 3; i++) {
            calculator.step();
        }
        const np = particles.length;
        particles = particles.filter(p => 0 <= p.pos.x && p.pos.x <= env.virtualWindowSize && p.pos.y <= env.virtualWindowSize);
        for (let i = 0; i < np - particles.length; i++) {
            particles.push(makeParticle(Math.random() * (env.right - env.left - 20) + env.left + 10,0));
        }
        render();
        requestAnimationFrame(frame);
    };
    frame();
});
