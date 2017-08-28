"use strict";
window.makeScreen = image => (rx,ry) => {
    const target = new THREE.WebGLRenderTarget(rx,ry);
    const getTexture = cont => cont(target.texture);
    const o = image(getTexture);
    o.clear = _ => GV.clearTarget(target);
    o.getTarget = cont => cont(target);
    return o;
};
