/*
 * 球を表しています。
 */
"use strict";
window.makeSphere = makeImplMesh => _ => {
    const createGeom = cont => cont(new THREE.SphereGeometry(radius, 30, 30, 0, 2 * Math.PI, 0, 2 * Math.PI));
    const implMesh = makeImplMesh(createGeom);
    const o = {};
    implMesh(o);
    let radius = 5;

    o.radius = r => {
        radius = r;
        return o;
    };

    return o;
};
