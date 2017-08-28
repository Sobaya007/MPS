"use strict";
window.makeProgressManager = _ => {
    let finishCount = 0;
    let progresses = [];
    const o = {};
    o.push = name => {
        let value = 0;
        const res = v => value = v;
        progresses.push({
            get : _ => value,
            name : name
        });
        return res;
    };
    o.total = _ => {
        progresses = progresses.filter(p => {
            if (p.get() >= 1) {
                finishCount++;
                return false;
            }
            return true;
        });
        return progresses.reduce((a,b) => a+b.get(), finishCount) / (progresses.length + finishCount);
    };
    return o;
};
