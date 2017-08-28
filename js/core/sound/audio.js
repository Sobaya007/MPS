"use strict";
window.makeAudio = _ => mesh => {
    let audio;
    const [get, set] = U.makeLazy();
    get(sound => audio.setBuffer(sound));
    const o = {};
    const def = f => e => {
        f(e);
        return o;
    };
    o.spdScale = def(spd => audio.setPlaybackRate(spd));
    o.gain = def(g => audio.setVolume(g));
    o.play = def(_ => {
        audio.setLoop(false);
        get(_ => audio.play());
    });
    o.playLoop = def(_ => {
        audio.setLoop(true);
        get(_ => audio.play());
    });
    o.stop = def(_ => {
        get(_ => audio.stop());
    });
    if(mesh === undefined) {
        //無引数。普通の音声。
        audio = new THREE.Audio(GV.audioListener);
        return {
            audio: o,
            onLoad: set
        };
    } else {
        //物体が発する音声
        audio = new THREE.PositionalAudio(GV.audioListener);
        mesh.addChild(audio);
        return {
            audio: o,
            onLoad: set
        };
    }
};
