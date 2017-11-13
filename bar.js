let gl;
var Bar = {
    init : () => {
        const canvas = (() => {
            const canvas = document.createElement("canvas");
            canvas.style.position = "absolute";
            return canvas;
        })();
        document.body.appendChild(canvas);
        gl = canvas.getContext("webgl");
        gl.getExtension('OES_texture_float');
        const onResize =  () => {
            const size = Math.min(window.innerWidth,window.innerHeight);
            const dx = (window.innerWidth - size) / 2;
            const dy = (window.innerHeight - size) / 2;
            canvas.style.left = dx + "px";
            canvas.style.top = dy + "px";
            canvas.style.width = size + "px";
            canvas.style.height = size + "px";
            canvas.width = size;
            canvas.height = size;
            gl.viewport(0,0,size,size);
            Bar.viewportSize = size;
        };
        onResize();
        window.addEventListener("resize", onResize);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    },
    loadImage : path => new Promise((resolve, reject) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // どんなサイズの画像でもレンダリングできるようにパラメータを設定する
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            // テクスチャーに画像のデータをアップロードする
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

            resolve(texture);
        };
    }),
    loadText : path => new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState != 4) {
                return;
            }
            if (xhr.status == 0 || xhr.status >= 400) {
                console.error(path + " cannot be loaded");
                return;
            }
            resolve(xhr.responseText);
        };
        xhr.open("GET", path, true);
        xhr.send(null);
    }),
    createVBO : data => new Promise((resolve, reject) => {
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        resolve(vbo);
    }),
    createProgram : (vsPath, fsPath) => new Promise((resolve, reject) => {
        Promise.all([Bar.loadText(vsPath), Bar.loadText(fsPath)]).then(([vsText, fsText]) => {
            const vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vsText);
            gl.compileShader(vs);

            const vsError = gl.getShaderInfoLog(vs);

            if (gl.getShaderParameter(vs, gl.COMPILE_STATUS) == 0) {
                reject("Vertex Shader Compile Error\n" + vsError);
                return;
            }

            const fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, fsText);
            gl.compileShader(fs);

            const fsError = gl.getShaderInfoLog(fs);

            if (gl.getShaderParameter(fs, gl.COMPILE_STATUS) == 0) {
                reject("Fragment Shader Compile Error\n" + fsError);
                return;
            }

            const program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);

            const linkError = gl.getProgramInfoLog(program);

            if (gl.getProgramParameter(program, gl.LINK_STATUS) == 0) {
                reject("Link Error\n" + linkError);
                return;
            }

            resolve(program);
        });
    }),
    createAttribute : dataList => {
        const flatten = [];
        dataList.forEach(data => data.forEach(d => {
            flatten.push(d);
        }));
        return new Promise(resolve => {
            Bar.createVBO(flatten).then(vbo => {
                resolve({
                    vbo : vbo,
                    dim : dataList[0].length }); }); });
    },
    attributes : (program, attributes) => {
        gl.useProgram(program);
        Object.keys(attributes).forEach(name => {
            const attribute = attributes[name];
            const loc = gl.getAttribLocation(program, name);
            gl.bindBuffer(gl.ARRAY_BUFFER, attribute.vbo);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, attribute.dim, gl.FLOAT, false, 0, 0);
        });
    },
    uniforms : (program, uniforms) => {
        gl.useProgram(program);
        Object.keys(uniforms).forEach(name => {
            const uniform = uniforms[name];
            const loc = gl.getUniformLocation(program, name);
            if (uniform instanceof Array) {
                switch (uniform.length) {
                    case 2:
                        gl.uniform2fv(loc, uniform);
                        break;
                    case 3:
                        gl.uniform3fv(loc, uniform);
                        break;
                    case 4:
                        gl.uniform4fv(loc, uniform);
                        break;
                }
            } else {
                gl.uniform1f(loc, uniform);
            }
        });
    },
    uniformTextures : (program, textures) => {
        gl.useProgram(program);
        let cnt = 0;
        Object.keys(textures).forEach(name => {
            const texture = textures[name];
            const texLocation = gl.getUniformLocation(program, name);
            gl.activeTexture(gl.TEXTURE0 + cnt);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(texLocation, cnt);
            cnt++;
        });
    },
    createRenderTarget : (width = Bar.viewportSize, height = Bar.viewportSize) => new Promise(resolve => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        resolve({
            frameBuffer: fb,
            texture : tex,
            width : width,
            height : height
        });
    }),
    renderTo : (renderTarget, render) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.frameBuffer);
        render();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return renderTarget.texture;
    },
    setOnMouseDown : callback => {
        document.addEventListener("mousedown", event => {
            const dx = (window.innerWidth  - Bar.viewportSize) / 2;
            const dy = (window.innerHeight - Bar.viewportSize) / 2;
            callback({
                x : (event.clientX - dx) / Bar.viewportSize * 2 - 1,
                y : (event.clientY - dy) / Bar.viewportSize * 2 - 1
            });
        });
    },
    setOnMouseUp : callback => {
        document.addEventListener("mouseup", event => {
            const dx = (window.innerWidth  - Bar.viewportSize) / 2;
            const dy = (window.innerHeight - Bar.viewportSize) / 2;
            callback({
                x : (event.clientX - dx) / Bar.viewportSize * 2 - 1,
                y : (event.clientY - dy) / Bar.viewportSize * 2 - 1
            });
        });
    },
    setOnMouseMove : callback => {
        document.addEventListener("mousemove", event => {
            const dx = (window.innerWidth  - Bar.viewportSize) / 2;
            const dy = (window.innerHeight - Bar.viewportSize) / 2;
            callback({
                x : (event.clientX - dx) / Bar.viewportSize * 2 - 1,
                y : (event.clientY - dy) / Bar.viewportSize * 2 - 1
            });
        });
    }
};
