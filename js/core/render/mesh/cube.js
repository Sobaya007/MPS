/*
 * 直方体を表しています。
 * デフォルトのサイズは1x1x1です。
 */
"use strict";
window.makeCube = makeImplMesh => {
    const implMesh = makeImplMesh(cont => cont(new THREE.CubeGeometry(1,1,1,10,10,10)));
    return _ => {
        const o = {};
        implMesh(o);
        return o;
    };
};
