/*global Stats */
"use strict";
window.GV = (_ => { //Global Variables
    const t = {};
    //===============constants================
    //Renderer
    t.W_ASP = 16;
    t.H_ASP = 9;
    //Camera
    const C_FOV = 60;
    const C_NEAR = 1;
    const C_FAR = 2000;
    //=================add renderer==============
    t.darkness = 1.0; //
    const renderer = (() => {
        const renderer = new THREE.WebGLRenderer({
        });
        renderer.setClearColor(0x000000);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.autoClear = false;
        renderer.shadowMap.enabled = true;
        renderer.context.getExtension("OES_standard_derivatives");
        document.body.appendChild(renderer.domElement);
        return renderer;
    })();
    t.renderer = renderer;
    //=====================3D====================
    //make scene
    t.scene3d = new THREE.Scene();
    t.scene3dOutOfBack = new THREE.Scene();
    //make camera
    t.camera3d = (() => {
        const camera = new THREE.PerspectiveCamera(C_FOV, t.W_ASP / t.H_ASP, C_NEAR, C_FAR);
        camera.position.set(0, 0, 50);
        return camera;
    })();
    const light3d = new THREE.AmbientLight(0x818181);
    t.scene3d.add(light3d);
    //add control
    //    t.control = (() => {
    //        var c = new THREE.OrbitControls(t.camera3d, renderer.domElement);
    //        c.enableDamping = true;
    //        c.dampingFactor = C_DAMP;
    //        c.enableZoom = true;
    //        return c;
    //    })();
    //add ear
    t.audioListener = (_ => {
        const audioListener = new THREE.AudioListener();
        t.camera3d.add(audioListener);
        return audioListener;
    })();
    //=========================2D==================
    t.scene2d = new THREE.Scene();
    //make camera
    t.camera2d = (() => {
        const camera = new THREE.OrthographicCamera(-t.W_ASP * 10, t.W_ASP * 10, //Left, Right
            t.H_ASP * 10, -t.H_ASP * 10, //Top,  Bottom
            -1, 1.5); //Near, Far
        camera.position.set(0, 0, 0.1);
        return camera;
    })();
    //add light
    (() => {
        const l = new THREE.AmbientLight(0xffffff);
        t.scene2d.add(l);
    })();
    t.fadeOuter = new THREE.ShaderPass({
        uniforms: {
            tDiffuse: {
                value: null
            },
            darkness: {
                value: 1.0
            }
        },
        vertexShader: [

            "varying vec2 vUv;",

            "void main() {",

            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}"

        ].join("\n"),
        fragmentShader: [

            "uniform float darkness;",

            "uniform sampler2D tDiffuse;",

            "varying vec2 vUv;",

            "void main() {",
            "vec4 texel = texture2D( tDiffuse, vUv );",
            "gl_FragColor = darkness * texel;",
            "}"
        ].join("\n")
    });
    const composer = (_ => {
        const c = new THREE.EffectComposer(renderer);
        const pass3d = new THREE.RenderPass(t.scene3d, t.camera3d);
        const pass2d = new THREE.RenderPass(t.scene2d, t.camera2d);
        const bloom2 = new THREE.BloomPass(1.0);
        const toScreen = new THREE.ShaderPass(THREE.CopyShader);
        pass2d.clear = false;
        toScreen.renderToScreen = true;
        c.addPass(pass3d);
        c.addPass(pass2d);
        //c.addPass(bloom2);
        c.addPass(t.fadeOuter);
        c.addPass(toScreen);
        return c;
    })();
    //======================Render=================
    t.clear = _ => {
        renderer.clear();
    };
    let render2s = [];
    t.render2 = (a, b, c) => {
        render2s.push({
            a: a,
            b: b,
            c: c
        });
    };
    //======================Render=================
    t.render = _ => {
        renderer.clear();
        render2s.forEach((e) => {
            renderer.render(e.a, e.b, e.c);
        });
        render2s = [];
        t.fadeOuter.uniforms["darkness"].value = t.darkness;
        composer.render();
    };
    t.clearTarget = target => {
        renderer.setClearColor(0xff0000);
        renderer.clearTarget(target, true, true, true);
        renderer.setClearColor(0x000000);
    };
    //=====================Updates==================
    t.updateControl = _ => {
        //    GV.control.update();
    };
    //=======================Event Listener===================
    const onResize = _ => {
        let w = window.innerWidth;
        let h = window.innerHeight;
        if(w * t.H_ASP > t.W_ASP * h) { //width is too big
            w = h * t.W_ASP / t.H_ASP;
        } else { //height is too big
            h = w * t.H_ASP / t.W_ASP;
        }
        const x = (window.innerWidth - w) / 2;
        const y = (window.innerHeight - h) / 2;
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        renderer.setViewport(x, y, w, h);
    };
    onResize();
    window.addEventListener("resize", onResize, false);
    return t;
})();
