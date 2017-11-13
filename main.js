const stats = new Stats();

document.body.appendChild(stats.domElement);

Bar.init();

Promise.all([
    Bar.createProgram("p.vert", "p.frag"),
    Bar.createProgram("p.vert", "normal.frag"),
    Bar.createProgram("post.vert", "post.frag"),
    Bar.createProgram("post.vert", "postWall.frag"),
    Bar.createAttribute([
        [0,0],
        [0,1],
        [1,0],
        [1,1]
    ]),
    Bar.createRenderTarget(),
    Bar.createRenderTarget(),
    Bar.loadImage("back.jpg")
]).then(([pProg, nProg, postProg, postWallProg, pAttr, renderTarget, normalRenderTarget, backTexture]) => {
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
        bottom : 400
    };

    Bar.attributes(pProg, {
        pos : pAttr
    });
    Bar.uniforms(pProg, {
        radius : env.r,
        windowSize : Bar.viewportSize
    });
    Bar.attributes(nProg, {
        pos : pAttr
    });
    Bar.uniforms(nProg, {
        radius : env.r,
        windowSize : Bar.viewportSize
    });
    Bar.attributes(postProg, {
        pos : pAttr
    });
    Bar.uniformTextures(postProg, {
        kernelTexture : renderTarget.texture,
        normalTexture : normalRenderTarget.texture,
        backgroundTexture : backTexture
    });
    Bar.attributes(postWallProg, {
        pos : pAttr
    });
    Bar.uniformTextures(postWallProg, {
        kernelTexture : renderTarget.texture,
        normalTexture : normalRenderTarget.texture,
        backgroundTexture : backTexture
    });

    const init = particles => {
        env.n0 = particles.map(p => sum(particles.filter(p2 => p != p2).map(p2 => weight(p, p2)))).reduce((a,b) => a > b ? a : b);
        env.lambda = particles.map(p => sum(particles.filter(p2 => p != p2).map(p2 => distanceSq(p, p2) * weight(p, p2))) / sum(particles.filter(p2 => p != p2).map(p2 => weight(p, p2)))).reduce((a,b) => a > b ? a : b);
        particles.forEach(p => p.frc.y = env.g);
    };

    const W = 700;
    const H = 700;
    const nW = Math.ceil(W / env.re);
    const nH = Math.ceil(H / env.re);

    const grid = [];
    for (let i = 0; i < nW; i++) {
        const po = [];
        for (let j = 0; j < nH; j++) {
            po.push([]);
        }
        grid.push(po);
    }

    const clearGrid = () => {
        for (let i = 0; i < nW; i++) {
            for (let j = 0; j < nH; j++) {
                grid[i][j] = [];
            }
        }
    };

    const render = () => {
        requestAnimationFrame(render);
        stats.update();
        for (let k = 0; k < 3; k++) {
            clearGrid();
            particleAndInners.forEach(p => p.registerGrid());
            particles.forEach(p => p.prepareStep());
            particles.forEach(p => p.step());
            clearGrid();
            particleAndInners.forEach(p => p.registerGrid());
            particleAndInners.forEach(p => p.prepareSolvePressure());
            const candidates = particleAndInners.filter(p => !p.isSurface);
            for (let i = 0; i < env.iter; i++) {
                candidates.forEach(p => p.solvePressure());
            }
            particles.forEach(p => p.prepareStep2());
            particles.forEach(p => p.step2());
        }
        const render2 = (x,y,t) => {
            t *= Math.PI * 2;
            const r = Math.sin(t) * .5 + .5;
            const g = Math.sin(t + Math.PI * 2 / 3) * .5 + .5;
            const b = Math.sin(t - Math.PI * 2 / 3) * .5 + .5;
            gl.useProgram(pProg);
            Bar.uniforms(pProg, {
                "center" : [x,y],
                "color" : [r,g,b]
            });
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        Bar.renderTo(renderTarget, () => {
            gl.clearColor(0,0,0,0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            particles.forEach(p => p.render());
        });
        Bar.renderTo(normalRenderTarget, () => {
            gl.clearColor(0,0,0,0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE);
            particles.forEach(p => p.renderNormal());
        });
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(postProg);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        Bar.renderTo(renderTarget, () => {
            gl.clearColor(0,0,0,0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            inners.forEach(p => p.render());
        });
        Bar.renderTo(normalRenderTarget, () => {
            gl.clearColor(0,0,0,0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE);
            inners.forEach(p => p.renderNormal());
        });
        //gl.disable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(postWallProg);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
        o.registerGrid = () => {
            const nx = Math.max(0, Math.min(nW-1, Math.floor(o.pos.x / env.re)));
            const ny = Math.max(0, Math.min(nH-1, Math.floor(o.pos.y / env.re)));
            grid[nx][ny].push(o);
        };
        o.prepareStep = () => {
            const nears = o.getNears();
            o.laplacianVelX = 2 * env.d / env.lambda / env.n0 * sum(nears.map(p => (p.vel.x - o.vel.x) * weight(o,p)));
            o.laplacianVelY = 2 * env.d / env.lambda / env.n0 * sum(nears.map(p => (p.vel.y - o.vel.y) * weight(o,p)));
        }
        o.step = () => {
            o.vel.x += env.dt * (env.nu * o.laplacianVelX + o.frc.x);
            o.vel.y += env.dt * (env.nu * o.laplacianVelY + o.frc.y);
            o.checkVel();
            o.pos.x += env.dt * o.vel.x;
            o.pos.y += env.dt * o.vel.y;
        };
        o.getNears = () => {
            const nx = Math.max(0, Math.min(nW-1, Math.floor(o.pos.x / env.re)));
            const ny = Math.max(0, Math.min(nH-1, Math.floor(o.pos.y / env.re)));
            const nears = [];
            for (let i = -1; i <= 1; i++) {
                if (nx+i < 0) continue;
                if (nx+i >= nW) continue;
                for (let j = -1; j <= 1; j++) {
                    if (ny+j < 0) continue;
                    if (ny+j >= nH) continue;
                    grid[nx+i][ny+j].forEach(p => {
                        if (o == p) return;
                        if (distance(o,p) > env.re) return;
                        nears.push(p);
                    });
                }
            }
            return nears;
        }
        o.prepareSolvePressure = () => {
            const nears = o.getNears();
            o.weights = nears.map(p => {return {p:p,w:weight(o,p)};});
            o.n = sum(nears.map(p => weight(o,p)));
            o.c = -env.alpha * env.rho0 * (o.n - env.n0) * env.lambda * env.n0 / (env.dt * env.dt * env.n0 * 2 * env.d);
            o.isSurface = o.n < env.beta * env.n0;
            if (o.isSurface) {
                o.pressure = 0;
            }
        };
        o.solvePressure = () => {
            // ap + b = c
            const b = sum(o.weights.map(w => w.p.pressure * w.w));
            const np = Math.min(5, (b - o.c) / o.n);
            o.dp = np - o.pressure;
            o.pressure = np;
        };
        o.prepareStep2 = () => {
            const nears = o.getNears();
            let minP = o.pressure;
            if (nears.length > 0)
                minP = Math.min(nears.map(p => p.pressure).reduce((a,b) => a < b ? a : b));

            o.gradPressureX = env.d / env.n0 * sum(nears.map(p => (p.pressure - minP) / distanceSq(o,p) * (p.pos.x - o.pos.x) * weight(o,p)));
            o.gradPressureY = env.d / env.n0 * sum(nears.map(p => (p.pressure - minP) / distanceSq(o,p) * (p.pos.y - o.pos.y) * weight(o,p)));
        };
        o.step2 = () => {
            const vx = o.vel.x;
            const vy = o.vel.y;
            const fixVelX = -env.dt * o.gradPressureX / env.rho0;
            const fixVelY = -env.dt * o.gradPressureY / env.rho0;
            o.vel.x += fixVelX;
            o.vel.y += fixVelY;
            o.checkVel();
            o.pos.x += env.dt * (o.vel.x - vx);
            o.pos.y += env.dt * (o.vel.y - vy);
        };
        o.render = () => {
            const t = (o.dp ? o.dp : 0) * 2 * Math.PI;
            const r = Math.sin(t) * .5 + .5;
            const g = Math.sin(t + Math.PI * 2 / 3) * .5 + .5;
            const b = Math.sin(t - Math.PI * 2 / 3) * .5 + .5;
            gl.useProgram(pProg);
            Bar.uniforms(pProg, {
                center : [o.pos.x, o.pos.y],
                color : [r,g,b],
            });
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        o.renderNormal = () => {
            gl.useProgram(nProg);
            Bar.uniforms(nProg, {
                center : [o.pos.x, o.pos.y],
            });
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        o.renderWall = () => {
            gl.useProgram(wProg);
            Bar.uniforms(wProg, {
                center : [o.pos.x, o.pos.y],
            });
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        return o;
    };

    const particles = [];
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 30; j++) {
            const x = 110 + i * env.l + env.l/2;
            const y = env.bottom - (j+1) * env.l;
            particles.push(makeParticle(x,y));
        }
    }
    const inners = [];
    const outers = [];
    const po = Math.ceil(env.re / env.l) * 2;
    for (let y = 100; y <= env.bottom; y += env.l) {
        inners.push(makeParticle(env.left, y));
        inners.push(makeParticle(env.right, y));
        for (let dx = env.l; dx <= env.l * po; dx += env.l) {
            outers.push(makeParticle(env.left - dx, y));
            outers.push(makeParticle(env.right + dx, y));
        }
    }
    for (let x = env.left+env.l; x < env.right; x += env.l) {
        inners.push(makeParticle(x, env.bottom));
    }
    for (let x = env.left-env.l * po; x <= env.right + env.l * po; x += env.l) {
        for (let dy = env.l; dy <= env.l * po; dy += env.l) {
            outers.push(makeParticle(x, env.bottom + dy));
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
});
