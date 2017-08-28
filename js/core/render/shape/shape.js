/*
 * 2次元物体を表します。
 */
"use strict";
window.makeMakeImplementsShape = (add, containers, makeShader, progressManager) => (createGeom,
        _createMaterial = cont => cont(new THREE.MeshBasicMaterial({
            color: 0xffffff
        })),
        createShape = (geom, mat) => new THREE.Mesh(geom, mat)) => shape => {
    let createMaterial = _createMaterial; //これしないと、shaderを誰かが使うと他の人も影響を受けてしまう
    const [_getMesh, setMesh] = U.makeLazy();
    const processes = [];
    let parentContainer = containers.root2d;
    const getMesh = cont => {
        _getMesh(cont);
        return shape;
    };
    shape.getMesh = getMesh;
    const getMaterial = contFromMat => getMesh(mesh => {
        const po = mesh => {
            if(mesh.material) {
                if(mesh.material.materials) {
                    mesh.material.materials.forEach(m => contFromMat(m));
                } else {
                    contFromMat(mesh.material);
                }
            }
        };
        po(mesh);
        mesh.children.forEach(child => {
            po(child);
        });
    });
    shape.add = (step, name) => getMesh(m => {
        const proc = add(_ => step(shape.kill), name);
        processes.push(proc);
    });
    const manageArgs = U.makeManageArgs(shape.add, getMesh);
    shape.manageArgs = manageArgs;
    const shader = makeShader(manageArgs);

    /*
     * center::(V,V) -> Shape
     * 中心座標に関するsetterです。
     * nullを指定すると、そこは変更しないことになります。
     */
    shape.center = manageArgs((x, y) => getMesh(m => {
        if (x !== null) m.position.setX(x);
        if (y !== null) m.position.setY(y);
    }), "center in shape");

    /*
     * angle::V->Shape
     * 回転角に関するsetterです。回転中心はcenter,UCWで回転、単位は度です。
     */
    shape.angle = manageArgs(a => getMesh(m => {
        m.rotation.z = a * Math.PI / 180;
    }), "angle in shape");

    shape.scale = manageArgs((x,y) => getMesh(m => {
        m.scale.set(x,y,1);
    }), "scale in mesh");
    /*
     * size::(V,V) -> Shape
     * 大きさに関するsetterです。拡大中心はcenterです。
     * nullを指定すると、そこは変更しないことになります。
     */
    shape.size = manageArgs((w, h) => getMesh(m => {
        m.scale.set(1,1,1);
        const box = new THREE.Box3().setFromObject(m);
        const W = box.max.x - box.min.x;
        const H = box.max.y - box.min.y;
        if (w !== null) m.scale.setX(w / W);
        if (h !== null) m.scale.setY(h / H);
    }), "size in shape");

    /*
     * sizeW::V->Shape
     * 幅に関するsetterです。指定した幅に合わせて、縦横比が変更前と同じになるようにスケールします。
     */
    shape.sizeW = manageArgs(w => getMesh(m => {
        m.scale.set(1,1,1);
        const box = new THREE.Box3().setFromObject(m);
        const W = box.max.x - box.min.x;
        const H = box.max.y - box.min.y;
        shape.size(w, w * H / W);
    }), "sizeW in shape");

    /*
     * sizeH::V->Shape
     * 高さに関するsetterです。指定した高さに合わせて、縦横比が変更前と同じになるようにスケールします。
     */
    shape.sizeH = manageArgs(h => getMesh(m => {
        m.scale.set(1,1,1);
        const box = new THREE.Box3().setFromObject(m);
        const W = box.max.x - box.min.x;
        const H = box.max.y - box.min.y;
        shape.size(h * W / H, h);
    }), "sizeH in shape");

    /*
     * color::(V,V,V)->Shape
     * 色に関するsetterです。並びはRGBで、範囲は[0,1]です。
     * nullを指定すると、そこは変更しないことになります。
     */
    shape.color = manageArgs((r,g,b) => getMaterial(mat => {
        if (r !== null) mat.color.r = r;
        if (g !== null) mat.color.g = g;
        if (b !== null) mat.color.b = b;
    }), "color in shape");

    /*
     * blend::(V)->Shape
     * ブレンドに関するsetterです。Vはブレンド名です。
     */
    shape.blend = manageArgs(b => getMaterial(mat => {
        mat.blending = b;
        mat.transparent = true;
    }), "blend in shape");

    /*
     * opacity::V->Shape
     * 透明度に関するsetterです。
     */
    shape.opacity = manageArgs(a => getMaterial(mat => {
        mat.opacity = a;
        mat.transparent = true;
    }), "opacity in shape");

    /*
     * texture::Image->Shape
     * テクスチャを設定する関数です。
     */
    shape.texture = (image, needsUpdate = true) => getMaterial(mat => image.getTexture(texture => {
        mat.needsUpdate = true;
        mat.map = texture;
        mat.map.needsUpdate = needsUpdate; //これは毎回やる必要があるっぽい
    }));

    /*
     * shader::(Shader->Shader)->Shape
     * Shaderに関するsetterです。
     * 引数settingにはShaderに関する設定を記述します。
     */
    shape.shader = setting => {
        const [s, create] = shader();
        setting(s);
        createMaterial = cont => create(cont);
        return shape;
    };

    /*
     * depth::V->Shape
     * 深度に関するsetterです。範囲は[0,1]です。
     */
    shape.depth = manageArgs(d => getMesh(m => {
        if (d > 1) d = 1;
        if (d < 0) d = 0;
        m.position.setZ(-d);
    }), "depth in shape");
    shape.manageArgs = manageArgs;
    shape.kill = _ => getMesh(m => {
        m.geometry.dispose();
        m.material.dispose();
        processes.forEach(proc => proc.kill());
        processes.length = 0;
        parentContainer.remove(shape);
    });
    shape.removeFromScene = name => getMesh(_ => {
        parentContainer.remove(shape);
    });
    shape.addToScene = _ => getMesh(_ => {
        parentContainer.add(shape);
    });
    shape.pause = _ => getMesh(_ => {
        processes.forEach(proc => proc.pause());
    });
    shape.resume = _ => getMesh(_ => {
        processes.forEach(proc => proc.resume());
    });
    shape.isActive = _ => {
        if (!parentContainer.isActive()) return false;
        return parentContainer.hasChild(shape);
    };
    shape.parent = name => {
        parentContainer = containers[name];
        return shape;
    };

    /*
     * go::(void->bool)->Shape
     * 実行時点までの変更内容を登録し、そのShapeをSceneに登録します。
     * 引数にはShapeの削除条件を記します。
     */
    shape.go = f => {
        const progress = progressManager.push(createGeom);
        parentContainer.add(shape);
        createGeom(geom => {
            progress(0.5);
            createMaterial(mat => {
                progress(1);
                const mesh = createShape(geom, mat);
                setMesh(mesh);
                //three.jsの初期化(ごり押し)
                const init = a => {
                    if (a instanceof THREE.Scene) {
                        a.children.forEach(c => init(c));
                    } else {
                        a.geometry._bufferGeometry = new THREE.BufferGeometry().setFromObject(mesh);
                    }
                };
                init(mesh);
            });
        });
        return shape;
    };
    shape.center(0, 0).depth(0);
    return [getMesh, manageArgs, getMaterial];
};
