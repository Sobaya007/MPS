"use strict";
window.makeBillLine = makeImplMesh => {
    const createMaterial = cont => cont(new THREE.MeshBasicMaterial({
        color: 0xffffff
    }));
    const createMesh = (geom, mat) => new THREE.Mesh(geom, mat);
    const createGeometry = cont => cont(new THREE.PlaneGeometry(1, 1, 1, 1));
    const implMesh = makeImplMesh(createGeometry, createMaterial, createMesh);
    return _ => {
        const o = {};
        const [getMesh, manageArgs,] = implMesh(o);

        let width = 1,
        length = 1;
        o.width = manageArgs(w => {
            if (w !== null) width = w;
        }, "width in billLine");
        o.length = manageArgs(h => {
            if (h !== null) length = h;
        }, "length in billLine");
        o.axis = manageArgs((x,y,z) => {
            axis.set(x, y, z);
        }, "axis in billLine");
        o.ends = (s, e) => {
            let d = V.binary(s, e, (s, e) => e - s);
            const len = V.length(d);
            d = V.unary(d, d => d / len);
            const c = V.binary(s, e, (s, e) => (s + e) / 2);
            o.center(c.x, c.y, c.z)
                .axis(d.x, d.y, d.z)
                .length(len);
            return o;
        };

        o.endsmove = (s, e, px, py, pz) => {
            let d = V.binary(s, e, (s, e) => e - s);
            const len = V.length(d);
            d = V.unary(d, d => d / len);
            const c = V.binary(s, e, (s, e) => (s + e) / 2);
            o.center(c.x + px, c.y + py, c.z + pz)
                .axis(d.x, d.y, d.z)
                .length(len);
            return o;
        };

        const cam = GV.camera3d;
        const axis = new THREE.Vector3(0, 1, 0).normalize();
        o.add(kill => {
            getMesh(mesh => {
                const camVec = new THREE.Vector3().subVectors(
                        mesh.position, cam.position).normalize();
                const s = -Math.sqrt(1 / (1 - axis.dot(camVec)));
                const t = -axis.dot(camVec) * s;
                const n = new THREE.Vector3().addVectors(new THREE
                        .Vector3().copy(axis).multiplyScalar(t),
                        new THREE.Vector3().copy(camVec).multiplyScalar(
                            s)).normalize();
                const up = axis;
                const side = new THREE.Vector3().crossVectors(
                        up, n).normalize();
                const newWorld = U.makeReplacement(side, up, n);
                newWorld.multiplyMatrices(new THREE.Matrix4().makeTranslation(
                            mesh.position.x, mesh.position.y,
                            mesh.position.z), newWorld);
                newWorld.multiplyMatrices(newWorld, new THREE.Matrix4()
                        .makeScale(width, length, 1));
                mesh.matrixAutoUpdate = false;
                mesh.matrix = newWorld;
            });
        }, "billLine");
        return o;
    };
};
