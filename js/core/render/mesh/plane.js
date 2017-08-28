/*
 * 平面を表します。デフォルトではサイズは200x200、向きはz軸を法線とするようになっています。
 */
/*global SimplexNoise */
"use strict";
window.makePlane = makeImplMesh => _ => {
    const o = {};
    let noise = false;
    const createGeom = cont => {
        let geom;
        if (noise) {
            geom = new THREE.PlaneGeometry(200,200,200,200);
            const noise = new SimplexNoise;
            geom.vertices.forEach(v => {
                v.z += 1 * noise.noise(v.x / 10, v.y / 10);
            });
            geom.computeVertexNormals();
            geom.computeFaceNormals();
        } else {
            geom = new THREE.PlaneGeometry(200,200);
        }
        cont(geom);
    };
    const implMesh = makeImplMesh(createGeom);
    implMesh(o);

    /*
     * noise::void->Plane
     * 平面をでこぼこにします。
     */
    o.noise = _ => {
        noise = true;
        return o; 
    };
    return o;
};
