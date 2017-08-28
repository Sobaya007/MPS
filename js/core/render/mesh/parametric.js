"use strict";
window.makeParametric = makeImplMesh => func => {
    let uDiv = 25;
    let vDiv = 25;
    const o = {
        uDiv : div => {
            uDiv = div;
            return o;
        },
        vDiv : div => {
            vDiv = div;
            return o;
        }
    };
    const createGeom = cont => cont(new THREE.ParametricGeometry(func, uDiv, vDiv));
    const implMesh = makeImplMesh(createGeom);
    implMesh(o);
    return o;
};
