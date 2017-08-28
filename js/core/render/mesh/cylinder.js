/*
 * 円筒形を表しています。
 * デフォルトは半径20, 長さ100です。
 */
"use strict";
window.makeCylinder = makeImplMesh => {
    const createGeom = cont => cont(new THREE.CylinderGeometry(20,20,100));
    const implMesh = makeImplMesh(createGeom);
    return _ => {
        const start = new THREE.Vector3(0, -50, 0);
        const end = new THREE.Vector3(0, 50, 0);
        const sub = new THREE.Vector3();
        const axis = new THREE.Vector3();
        const up = new THREE.Vector3(0,1,0);
        const o = {};

        //center, rotate, sizeを適切な値で呼び出します。
        const update = _ => {
            //中心座標は端点の中点
            o.center(
                    (start.x + end.x) / 2,
                    (start.y + end.y) / 2,
                    (start.z + end.z) / 2);
            //長さは端点間の距離
            o.size(null, start.distanceTo(end), null);
            //回転量はY軸と端点間ベクトルの内積と外積から:wakaru:
            sub.subVectors(end, start).normalize(); //sub = normalize(end - start);
            const dot = up.dot(sub);
            let angle;
            if (dot === 1) {
                angle = 0;
                axis.set(1,0,0);
            } else if (dot === -1) {
                angle = 180;
                axis.set(1,0,0);
            } else {
                angle = Math.acos(dot) * 180 / Math.PI;
                axis.crossVectors(up, sub).normalize();  //sub = cross(up, sub);
            }
            o.rotate(axis.x, axis.y, axis.z, angle);
        };
        const [,manageArgs,] = implMesh(o);

        /*
         * radius::float->Cylinder
         * Cylinderの半径に関するsetterです。
         */
        o.radius = r => o.size(r, null, r);

        /*
         * start::(V,V,V)->Cylinder
         * Cylinderの端点に関するsetterです。
         * これはcenter, rotate, sizeを適切に呼び出しているにすぎません。
         */
        o.start = manageArgs((x,y,z) => {
            if (x !== null) start.setX(x);
            if (y !== null) start.setY(y);
            if (z !== null) start.setZ(z);
            update();
        }, "start in cylinder");

        /*
         * end::(V,V,V)->Cylinder
         * Cylinderの端点に関するsetterです。
         * これはcenter, rotate, sizeを適切に呼び出しているにすぎません。
         */
        o.end = manageArgs((x,y,z) => {
            if (x !== null) end.setX(x);
            if (y !== null) end.setY(y);
            if (z !== null) end.setZ(z);
            update();
        }, "end in cylinder");
        return o;
    };
};
