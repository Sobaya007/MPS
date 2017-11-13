const prepareRendering = () => new Promise(resolve => {
    const stats = new Stats();
    document.body.appendChild(stats.domElement);
    Bar.init();
    Promise.all([
        Bar.createProgram("res/p.vert", "res/p.frag"),
        Bar.createProgram("res/p.vert", "res/normal.frag"),
        Bar.createProgram("res/post.vert", "res/post.frag"),
        Bar.createProgram("res/post.vert", "res/postWall.frag"),
        Bar.createAttribute([
            [0,0],
            [0,1],
            [1,0],
            [1,1]
        ]),
        Bar.createRenderTarget(),
        Bar.createRenderTarget(),
        Bar.loadImage("res/back.jpg")
    ]).then(([pProg, nProg, postProg, postWallProg, pAttr, renderTarget, normalRenderTarget, backTexture]) => {

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
        const render = () => {
            stats.update();
            Bar.renderTo(renderTarget, () => {
                gl.clearColor(0,0,0,0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                particles.forEach(p => p.render(pProg));
            });
            Bar.renderTo(normalRenderTarget, () => {
                gl.clearColor(0,0,0,0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                particles.forEach(p => p.render(nProg));
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
                inners.forEach(p => p.render(pProg));
            });
            Bar.renderTo(normalRenderTarget, () => {
                gl.clearColor(0,0,0,0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                inners.forEach(p => p.render(nProg));
            });
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.useProgram(postWallProg);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        resolve(render);
    });
});
