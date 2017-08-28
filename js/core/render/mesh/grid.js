/*
 * グリッドを表しています。
 * デフォルトは100x100のサイズ中に格子が50x50個あります。
 * デバッグ用を想定しているため、色は変更できません。
 */
"use strict";
window.makeGrid = makeImplMesh => _ => {
    const createGeom = cont => cont(new THREE.GridHelper(100, cellNum, 0xffffff, 0xffffff));
    const createMat = cont => cont();
    const createMesh = (geom, mat) => geom;
    const implMesh = makeImplMesh(createGeom, createMat, createMesh);
    let cellNum = 50;
    const o = {};
    implMesh(o);

    /*
     * cellNum::int->Grid
     * Gridの格子の数に関するsetterです。
     */
    o.cellNum = c => {
        cellNum = c;
        return o;
    };
    return o;
};
