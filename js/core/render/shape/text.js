/*
 * 文字を表します。
 * Three.jsでは本来3D形状として文字を扱えますが、意味わからんので2次元物体として扱います。
 */
"use strict";
window.makeText = (sprite, makeCanvas, rootPath) => {
    let contFromFont = [];
    document.fonts.ready.then(fontFaceSet => {
        if(fontFaceSet.check("10px SabaCrackFont")) {
            contFromFont.forEach(f => f());
            contFromFont = [];
        } else {
            document.fonts.addEventListener("loadingdone", _ => {
                contFromFont.forEach(f => f());
                contFromFont = [];
            });
        }
    });
    return _ => {
        const RESOLUTION = 1024;
        const o = sprite();
        const canvas = makeCanvas(RESOLUTION, RESOLUTION);
        const po = 2;
        let text;
        let [red, green, blue] = [0, 0, 0];
        const draw = _ => {
            canvas.getContext(ctx => {
                ctx.font = "10px SabaCrackFont";
                const width = ctx.measureText(text)
                    .width;
                const height = parseInt(ctx.font) * po; //1.2にするとよいというのはデファクトスタンダードらしい
                const scale = RESOLUTION / Math.max(width, height);
                ctx.save();
                ctx.clearRect(0, 0, RESOLUTION, RESOLUTION);
                ctx.scale(scale, scale);
                ctx.textAlign = "center";
                ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
                ctx.fillText(text, RESOLUTION / 2 / scale, RESOLUTION / 2 / scale);
                ctx.restore();
                o.texture(canvas); //これは毎回やらないとダメっぽい
            });
            if(contFromFont) contFromFont.push(draw); //フォントが読み込まれたら再書き込みする
        };
        /*
         * text:string->Text
         * 文字に関するsetterです。
         */
        o.text = o.manageArgs(t => {
            text = t;
            draw();
            return o;
        }, "text in text");
        /*
         * o自体はSprite。こいつの大きさは正方形がよい。(キャンバスレベルでは256x256の描画領域に描いているから、Spriteが正方形じゃないと縦横比が崩れる)
         */
        /*
         * @Override
         * w,hの描画領域に文字列が収まるようにする
         */
        const bsize = o.size;
        o.size = (w, h) => {
            canvas.getContext(ctx => {
                const width = ctx.measureText(text)
                    .width;
                const height = parseInt(ctx.font) * po;
                const max = Math.max(width, height);
                const size = max * Math.min(w / width, h / height);
                bsize(size, size);
            });
            return o;
        };
        /*
         * @Override
         */
        o.color = o.manageArgs((r, g, b) => {
            red = Math.floor(r * 0xff);
            green = Math.floor(g * 0xff);
            blue = Math.floor(b * 0xff);
            draw();
            return o;
        }, "color in text");
        o.texture(canvas);
        o.opacity(1.0);
        return o;
    };
};
