"use strict";
window.makeMakeLoadImage = (rootPath, makeLoad) => {
    const textureLoader = new THREE.TextureLoader();
    const load = makeLoad((path, cont, onProgress) => textureLoader.load(path, cont, onProgress));
    return image => path => {
        path = rootPath + "img/" + path;
        return image(load(path));
    };
};
