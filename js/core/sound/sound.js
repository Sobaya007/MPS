"use strict";
window.makeMakeLoadSound = (rootPath, makeLoad) => (audio, sounds) => {
    const audioLoader = new THREE.AudioLoader(); 
    const load = makeLoad((path, cont, onProgress) => audioLoader.load(path, cont, onProgress));
    return path => {
        path = rootPath + "sound/" + path;
        const getSound = load(path);
        const o = {
            /*
             * into::string->void
             * nameを受け取り、その名前でSceneに登録します。
             */
            into : id => {
                sounds[id] = o;
                return o;
            },
            global : _ => {
                const a = audio();
                getSound(a.onLoad);
                return a.audio;
            },
            at : mesh => {
                const a = audio(mesh);
                getSound(a.onLoad);
                return a.audio;
            },
            path : path
        };
        return o;
    };
};
