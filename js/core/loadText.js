"use strict";
window.makeMakeLoadText = (rootPath, makeLoad) => {
    const xhrLoader = new THREE.XHRLoader();
    const load = makeLoad((path, cont, onProgress) => xhrLoader.load(path, cont, onProgress));
    return texts => {
        return path => {
            path = rootPath + path;
            const o = {
                getText: load(path)
            };
            return o;
        };
    };
};
