/*
 * スプライトを定義します。
 * スプライトとは、簡単に扱える矩形の2次元上の物体のことです。
 * 主にUIなどで使われることを想定しています。
 */
"use strict";
window.makeSprite = makeImplShape => {
    const createGeometry = cont => cont(new THREE.PlaneGeometry(200,200));
    const implShape = makeImplShape(createGeometry);
    return _ => {
        const o = {};
        const [, manageArgs,getMaterial] = implShape(o);
        o.trim = manageArgs((x,y,w,h) => getMaterial(mat => {
            const t = mat.map;
            t.offset.set(x,y);
            t.repeat.set(w,h);
        }), "trim in sprite");

        return o;
    };
};
