"use strict";
window.makePoints = makeImplMesh => _ => {
    let positions, color;
    const o = {
        positions : p => {
            positions = p;
            return o;
        },
        color : c => {
            color = c;
            return o;
        },
        genPositions : (n, f) => {
            positions = [];
            for (let i = 0; i < n; i++) {
                const p = f(i);
                positions.push(p);
            }
            return o;
        },
        pointSize : size => getMaterial(mat => {
            mat.size = size;
        })
    };
    const createGeometry = cont => {
        const geom = new THREE.Geometry();
        positions.forEach(p => geom.vertices.push(new THREE.Vector3(p.x, p.y, p.z)));
        cont(geom);
    };
    const createMaterial = cont => {
        cont(new THREE.PointsMaterial({
            color : new THREE.Color(color.x, color.y, color.z),
            size : 10
        }));
    };
    const createMesh = (geom, mat) => {
        return new THREE.Points(geom, mat);
    };
    const implMesh = makeImplMesh(createGeometry, createMaterial, createMesh);
    const [,, getMaterial] = implMesh(o);
    return o;
};
