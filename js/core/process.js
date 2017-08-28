"use strict";
window.makeMakeProcess = add => (proc, name) => {
    const o = {};
    let alive = true;
    let pause = false;
    o.proc = kill => {
        if (!alive) {
            kill();
            return;
        }
        if (pause) return;
        proc(kill);
    };
    o.kill = _ => {
        alive = false;
    };
    o.isAlive = _ => alive;
    o.pause = _ => {
       pause = true;
    };
    o.resume = _ => {
       pause = false;
    };
    o.name = name;
    return o;
};
