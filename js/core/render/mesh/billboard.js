/*
 * ビルボードを定義します。
 * ビルボードとは、常にカメラの方を向く矩形の3次元上の物体のことです。
 * 主にエフェクトのパーティクルなどで使われることを想定しています。
 */

"use strict";
window.makeBillboard = (makeImplMesh) => {
    const createMaterial = cont => cont(new THREE.MeshBasicMaterial({
        color : 0xffffff
    }));
    const createMesh = (geom, mat) => new THREE.Mesh(geom, mat);
    const createGeometry = cont => cont(new THREE.PlaneGeometry(1,1,1,1));
    const implMesh = makeImplMesh(createGeometry, createMaterial, createMesh);
    return (autostep = true) => {
        const o = {};
        const [getMesh, manageArgs, getMaterial] = implMesh(o);

        /*
         * angle::V->BillBoard
         * BillBoardの角度に関するsetterです。回転中心はcenter、UCWで回転、単位は度です。
         */
        o.angle = manageArgs(a => getMaterial(mat => {
            //Spriteはrotationが効かないので、SpriteMaterialからやる必要がある
            mat.rotation = a * Math.PI / 180;
        }), "angle in billboard");

        /*
         * @Override
         */
        o.size = manageArgs((w,h) => getMesh(m => {
            //Spriteはデフォルトのサイズが1x1らしい
            if (w !== null) m.scale.setX(w);
            if (h !== null) m.scale.setY(h);
        }), "size in billboard");

        const camVec = new THREE.Vector3();
        const side = new THREE.Vector3();
        const up = new THREE.Vector3();
        const newWorld = new THREE.Matrix4();
        const translation = new THREE.Matrix4();
        const scale = new THREE.Matrix4();
        const cam = GV.camera3d;
        const step = mesh => {
            camVec.set(0,0,1);
            camVec.applyQuaternion(cam.quaternion);
            side.crossVectors(cam.up, camVec).normalize();
            up.crossVectors(camVec, side).normalize();
            newWorld.makeBasis(side, up, camVec);
            translation.makeTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
            newWorld.multiplyMatrices(translation, newWorld);
            scale.makeScale(mesh.scale.x, mesh.scale.y, mesh.scale.z);
            newWorld.multiplyMatrices(newWorld, scale);
            mesh.matrixAutoUpdate = false;
            mesh.matrix = newWorld;
        };
        if (autostep) {
            getMesh(mesh => {
                o.add(_ => step(mesh), "billboard");
            });
        } else {
            o.step = _ => {
                getMesh(mesh => {
                    step(mesh);
                });
            };
        }

        return o;
    };
};
