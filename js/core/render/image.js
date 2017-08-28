/*
 * 画像を表します。
 * ここからspriteやbillboardを使って、画像を表示します。
 * 画像の読み込みは非同期に行われるため、goした瞬間に表示されるとは限りません。
 */
"use strict";
window.makeImage = (sprite, billboard, billLine, textures) => getTexture => {
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
        billboard : (autostep = true) => {
            const b = billboard(autostep);
            b.texture(o);
            return b;
        },
        billLine : _ => {
            const b = billLine();
            b.texture(o);
            return b;
        },
        getTexture : getTexture
    };
    return o;
};
