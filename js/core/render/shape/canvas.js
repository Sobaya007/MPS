/*
 * javascriptのcanvasを使い、テクスチャに動的書き込みを行います。
 * 基本的にはimageと同じ扱いですが、getContextがあり、そこにcontextを受け取るコールバックを指定することでテクスチャに描画できます。
 */
"use strict";
window.makeMakeCanvas = (sprite, billboard, billLine, textures) => {
    const makeCanvas = (resX = 256, resY = 256) => {
        const canvas = document.createElement("canvas");
        canvas.width = resX;
        canvas.height = resY;
        const texture = new THREE.Texture(canvas);
        const o = {
            /*
             * into::string->void
             * nameを受け取り、その名前でSceneに登録します。
             */
            into : id => {
                textures[id] = o;
                return o;
            },
            /*
             * sprite::void->Sprite
             * このImageを使ってSpriteを作ります。
             */
            sprite    : _ => {
                const s = sprite();
                s.texture(o);
                return s;
            },
            /*
             * billboard::void->Billboard
             * このImageを使ってBillboardを作ります。
             */
            billboard : _ => {
                const b = billboard();
                b.texture(o);
                return b;
            },
            billLine : _ => {
                const b = billLine();
                b.texture(o);
                return b;
            },
            getContext : cont => {
                cont(canvas.getContext("2d"));
                return o;
            },
            getTexture : contFromTexture => {
                contFromTexture(texture);
            },
            //2のべき乗にしないと警告が出るので注意
            setQuality : v => {
              canvas.width *= v;
              canvas.height *= v;
              canvas.getContext("2d").scale(v,v);
              return o;
            }
        };
        return o;
    };
    return makeCanvas;
};
