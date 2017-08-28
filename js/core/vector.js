"use strict";
window.V = (_ => {
    const u = {};
    u.vec = (x,y,z) => {
        return {
            x : x,
            y : y,
            z : z
        };
    };
    u.copy = v => {
        return {
            x : v.x,
            y : v.y,
            z : v.z
        };
    };
    u.unary = (v,f) => {
        return {
            x : f(v.x),
            y : f(v.y),
            z : f(v.z)
        };
    };
    u.binary = (a,b,f) => {
        return {
            x : f(a.x, b.x),
            y : f(a.y, b.y),
            z : f(a.z, b.z)
        };
    };
    u.app = (a,f) => {
        a.x = f(a.x);
        a.y = f(a.y);
        a.z = f(a.z);
    };
    u.appB = (a,b,f) => {
        a.x = f(a.x,b.x);
        a.y = f(a.y,b.y);
        a.z = f(a.z,b.z);
    };
    u.add = (a,b) => {
        return {
            x : a.x + b.x,
            y : a.y + b.y,
            z : a.z + b.z
        };
    };
    u.sub = (a,b) => {
        return {
            x : a.x - b.x,
            y : a.y - b.y,
            z : a.z - b.z
        };
    };
    u.appAdd = (a,b) => {
        a.x += b.x;
        a.y += b.y;
        a.z += b.z;
    };
    u.appSub = (a,b) => {
        a.x -= b.x;
        a.y -= b.y;
        a.z -= b.z;
    };
    u.appMult = (a,s) => {
        a.x *= s;
        a.y *= s;
        a.z *= s;
    };
    u.appDiv = (a,s) => {
        a.x /= s;
        a.y /= s;
        a.z /= s;
    };
    u.po = function(...args) {
        const realArgs = U.dropTail(args);
        const func = U.last(args);
        return {
            x : func(...realArgs.map(v => v.x)),
            y : func(...realArgs.map(v => v.y)),
            z : func(...realArgs.map(v => v.z))
        };
    };
    u.normalize = v => {
        const length = u.length(v);
        return {
            x : v.x / length,
            y : v.y / length,
            z : v.z / length
        };
    };
    u.length = v => {
        const dx = v.x;
        const dy = v.y;
        const dz = v.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    };
    u.distance = (a,b) => {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    };
    u.center = (a,b) => {
        return {
            x : (a.x + b.x) / 2,
            y : (a.y + b.y) / 2,
            z : (a.z + b.z) / 2
        };
    };
    u.dot = (a,b) => {
        return a.x * b.x
            + a.y * b.y
            + a.z * b.z;
    };
    u.cross = (a,b) => {
        return {
            x : a.y * b.z - a.z * b.y,
            y : a.z * b.x - a.x * b.z,
            z : a.x * b.y - a.y * b.x
        };
    };
    u.randVec = r => {
        if (r === undefined) r = 1;
        return {
            x : (Math.random() * 2 - 1) * r,
            y : (Math.random() * 2 - 1) * r,
            z : (Math.random() * 2 - 1) * r
        };
    };
    u.randVecSphereSurface = r => {
        if (r === undefined) r = 1;
        const theta = Math.random() * 2 * Math.PI;
        const z = Math.random() * 2 - 1;
        const po = Math.sqrt(1 - z * z);
        return {
            x : r * po * Math.cos(theta),
            y : r * po * Math.sin(theta),
            z : r * z
        };
    };
    u.randVecSphere = r => {
        if (r === undefined) r = 1;
        const theta = Math.random() * 2 * Math.PI;
        const z = Math.random() * 2 - 1;
        const po = Math.sqrt(1 - z * z);
        const radius = r * Math.pow(Math.random(), 1 / 3);
        return {
            x : radius * po * Math.cos(theta),
            y : radius * po * Math.sin(theta),
            z : radius * z
        };
    };
    //axisを法線とする面上のランダムなベクトルを作ります
    u.randAround = axis => {
        const theta = Math.random() * 2 * Math.PI;
        const a = u.ortho(axis);
        const b = u.normalize(u.cross(a, axis));
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return u.binary(a, b, (a,b) =>
                a * c + b * s);
    };
    u.ortho = v => {
        const rand = u.randVec();
        const side = u.normalize(u.cross(v, rand));
        const up = u.normalize(u.cross(side, v));
        const theta = Math.random() * 2 * Math.PI;
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return {
            x : side.x * c + up.x * s,
            y : side.y * c + up.y * s,
            z : side.z * c + up.z * s,
        };
    };
    u.fromAngle = (theta, phi) => {
        const cp = Math.cos(phi);
        return u.vec(
                Math.cos(theta) * cp,
                Math.sin(phi),
                Math.sin(theta) * cp
                );
    };
    u.array = v => [v.x, v.y, v.z];
    u.farray = v => [
        _ => v.x,
        _ => v.y,
        _ => v.z
    ];
    return u;
})();
