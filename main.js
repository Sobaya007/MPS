const env = {
    dt : 1,
    nu : 0.1,
    rho0 : 1,
    r : 20,
    re : 14,
    d : 2,
    alpha : 0.1,
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
const particles = [];
const inners = [];
const outers = [];
const grid = makeGrid();
const calculator = makeCalculator();

prepareRendering().then(render => {
    const frame = () => {
        for (let i = 0; i < 3; i++) {
            calculator.step();
        }
        render();
        requestAnimationFrame(frame);
    };
    frame();
});
