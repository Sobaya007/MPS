/*
 * 矩形を表します。
 */
"use strict";
window.makeRect = makeImplShape => {
    const createGeom = cont => cont(new THREE.PlaneGeometry(1,1,10,10));
    const implShape = makeImplShape(createGeom);
    return _ => {
        const o = {};
        implShape(o);
        return o;
    };
};
