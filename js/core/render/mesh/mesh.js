/* * 3次元物体を表します。
 */
"use strict";
window.makeMakeImplementsMesh = (add, containers, makeShader, progressManager) => (createGeom, _createMaterial = cont => cont(new THREE.MeshPhongMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
})), createMesh = (geom, mat) => new THREE.Mesh(geom, mat)) => shape => {
    let createMaterial = _createMaterial;
    const [_getMesh, setMesh] = U.makeLazy();
    const processes = [];
    let parentContainer = containers.root3d;
    const tmpVec = new THREE.Vector3();
    const getMesh = (f, name) => {
        _getMesh(f, name);
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
        if (!shape.isActive()) proc.pause();
    });
    const manageArgs = U.makeManageArgs(shape.add);
    const shader = makeShader(manageArgs);
    /*
     * center::(V,V,V) -> Mesh
     * 中心座標に関するsetterです。
     * nullを指定すると、そこは変更しないことになります。
     */
    shape.center = manageArgs((x, y, z) => getMesh(m => {
        if(x !== null) m.position.setX(x);
        if(y !== null) m.position.setY(y);
        if(z !== null) m.position.setZ(z);
    }), "center in mesh");
    /*
     * rotate::(float,float,float,V) -> Mesh
     * 回転に関するsetterです。回転中心はcenter、UCWで回転、単位は度です。
     * 引数はAxis-Angle形式です。
     */
    shape.rotate = manageArgs((x,y,z,a) => getMesh(m => {
        const axis = tmpVec.set(x, y, z).normalize();
        m.quaternion.setFromAxisAngle(axis, a * Math.PI / 180);
    }), "rotate in mesh");

    shape.lookAt = manageArgs((x,y,z) => getMesh(m => {
        const vec = tmpVec.set(x,y,z);
        m.lookAt(vec);
    }), "lookAt in mesh");

    shape.lookTo = manageArgs((x,y,z) => getMesh(m => {
        const vec = tmpVec.set(x,y,z);
        vec.add(m.position);
        m.lookAt(vec);
    }), "lookTo in mesh");
    shape.getB = _ => {
        let res;
        getMesh(m => {
            res = getBox(m);
        });
        return res;
    };
    const getBox = m => {
        if(m !== undefined) {
            const box = new THREE.Box3();
            const rx = m.rotation.x;
            const ry = m.rotation.y;
            const rz = m.rotation.z;
            m.rotation.x = 0;
            m.rotation.y = 0;
            m.rotation.z = 0;
            box.setFromObject(m);
            m.rotation.x = rx;
            m.rotation.y = ry;
            m.rotation.z = rz;
            const min = (a, b) => {
                if(a === undefined || isNaN(a)) return b;
                if(b === undefined || isNaN(b)) return a;
                return Math.min(a, b);
            };
            const max = (a, b) => {
                if(a === undefined || isNaN(a)) return b;
                if(b === undefined || isNaN(b)) return a;
                return Math.max(a, b);
            };
            m.children.forEach(c => {
                const boxc = getBox(c);
                box.min.x = min(box.min.x, boxc.min.x);
                box.min.y = min(box.min.y, boxc.min.y);
                box.min.z = min(box.min.z, boxc.min.z);
                box.max.x = max(box.max.x, boxc.max.x);
                box.max.y = max(box.max.y, boxc.max.y);
                box.max.z = max(box.max.z, boxc.max.z);
            });
            return box;
        }
    };
    shape.scale = manageArgs((x,y,z) => getMesh(m => {
        m.scale.set(x,y,z);
    }), "scale in mesh");
    /*
     * size::(V,V,V) -> Mesh
     * 大きさに関するsetterです。拡大中心はcenterです。
     * nullを指定すると、そこは変更しないことになります。
     */
    shape.size = manageArgs((w, h, d) => getMesh(m => {
        const eps = 1e-5;
        const box = getBox(m);
        const W = (box.max.x - box.min.x) / m.scale.x;
        const H = (box.max.y - box.min.y) / m.scale.y;
        const D = (box.max.z - box.min.z) / m.scale.z;
        if(w !== null && W > eps) m.scale.setX(w / W);
        if(h !== null && H > eps) m.scale.setY(h / H);
        if(d !== null && D > eps) m.scale.setZ(d / D);
    }), "size in mesh");
    /*
     * sizeW::V->Mesh
     * 幅に関するsetterです。指定した幅に合わせて、縦横比が変更前と同じになるようにスケールします。
     */
    shape.sizeW = manageArgs(w => getMesh(m => {
        const box = getBox(m);
        const W = box.max.x - box.min.x;
        const H = box.max.y - box.min.y;
        const D = box.max.z - box.min.z;
        shape.size(w, w * H / W, w * D / W);
    }), "sizeW in mesh");
    /*
     * sizeH::V->Mesh
     * 高さに関するsetterです。指定した高さに合わせて、縦横比が変更前と同じになるようにスケールします。
     */
    shape.sizeH = manageArgs(h => getMesh(m => {
        const box = getBox(m);
        const W = box.max.x - box.min.x;
        const H = box.max.y - box.min.y;
        const D = box.max.z - box.min.z;
        shape.size(h * W / H, h, h * D / H);
    }), "sizeH in mesh");
    /*
     * sizeD::V->Mesh
     * 奥行きに関するsetterです。指定した奥行きに合わせて、縦横比が変更前と同じになるようにスケールします。
     */
    shape.sizeD = manageArgs(d => getMesh(m => {
        const box = getBox(m);
        const W = box.max.x - box.min.x;
        const H = box.max.y - box.min.y;
        const D = box.max.z - box.min.z;
        shape.size(d * W / D, d * H / D, d);
    }), "sizeD in mesh");
    /*
     * amb::(V,V,V)->Mesh
     * 環境色に関するsetterです。並びはRGBで、範囲は[0,1]です。
     * nullを指定すると、そこは変更しないことになります。
     */
    shape.amb = manageArgs((r,g,b) => getMaterial(mat => {
        //多分これ
        if(r !== null) mat.emissive.r = r;
        if(g !== null) mat.emissive.g = g;
        if(b !== null) mat.emissive.b = b;
    }), "amb in mesh");
    /*
     * dif::(V,V,V)->Mesh
     * 拡散色に関するsetterです。並びはRGBで、範囲は[0,1]です。
     * nullを指定すると、そこは変更しないことになります。
     */
    shape.dif = manageArgs((r,g,b) => getMaterial(mat => {
        //なぜかこれ
        if(r !== null) mat.color.r = r;
        if(g !== null) mat.color.g = g;
        if(b !== null) mat.color.b = b;
    }), "dif in mesh");
    /*
     * spc::(V,V,V)->Mesh
     * 反射色に関するsetterです。並びはRGBで、範囲は[0,1]です。
     * nullを指定すると、そこは変更しないことになります。
     */
    shape.spc = manageArgs((r,g,b) => getMaterial(mat => {
        if(r !== null) mat.specular.r = r;
        if(g !== null) mat.specular.g = g;
        if(b !== null) mat.specular.b = b;
    }), "spc in mesh");
    /*
     * shine::V->Mesh
     * 輝度に関するsetterです。
     */
    shape.shine = manageArgs(s => getMaterial(mat => {
        mat.shininess = s;
    }), "shine in mesh");
    /*
     * opacity::V->Mesh
     * 透明度に関するsetterです。
     */
    shape.opacity = manageArgs(a => getMaterial(mat => {
        mat.opacity = a;
        mat.transparent = true;
    }), "opacity in mesh");
    /*
     * texture::Image->Mesh
     * テクスチャを設定する関数です。
     */
    shape.texture = (image, needsUpdate = true) => getMaterial(mat => image.getTexture(texture => {
        mat.needsUpdate = true;
        mat.map = texture;
        mat.map.needsUpdate = needsUpdate; //これは毎回やる必要があるっぽい
    }));
    shape.textureRepeat = (image, x, y) => getMaterial(mat => image.getTexture(texture => {
        mat.map = texture;
        mat.map.wrapS = THREE.RepeatWrapping;
        mat.map.wrapT = THREE.RepeatWrapping;
        mat.map.repeat.set(x, y);
        mat.needsUpdate = true;
    }));
    /*
     * blend :: int->Mesh
     * ブレンドの方法を決めます。
     * 引数にはThree.jsによって作られたブレンドモードを指定します。
     * NoBlending
     * NormalBlending
     * AdditiveBlending
     * SubtractiveBlending
     * MultiplyBlending
     * AdditiveAlphaBlending
     */
    shape.blend = b => getMaterial(m => {
        m.blending = b;
        m.transparent = true;
    });
    /*
     * customBlend ::((int,int,int)->void)->Mesh
     * ブレンドの方法を決めます。
     * THREE.jsによって作られたものではないものを作るときに使います
     */
    shape.customBlend = (src, dst, eq) => getMaterial(mat => {
        mat.blending = THREE.CustomBlending;
        mat.blendSrc = src;
        mat.blendDst = dst;
        mat.blendEquation = eq;
    });
    shape.depthWrite = b => getMaterial(mat => {
        mat.depthWrite = b;
    });
    shape.fog = b => getMaterial(m => {
        m.fog = b;
    });
    /*
     * castShadow::bool->Mesh
     * 影を生成するかを決定するsetterです。
     */
    shape.castShadow = b => getMesh(m => {
        m.castShadow = b;
    });
    /*
     * receiveShadow::bool->Mesh
     * 影を描画するかを決定するsetterです。
     */
    shape.receiveShadow = b => getMesh(m => {
        m.receiveShadow = b;
    });
    /*
     * shader::(Shader->Shader)->Mesh
     * Shaderに関するsetterです。
     * 引数settingにはShaderに関する設定を記述します。
     */
    shape.shader = setting => {
        const [s, create] = shader();
        setting(s);
        createMaterial = cont => create(cont);
        return shape;
    };
    shape.renderOrder = order => getMesh(m => {
        m.renderOrder = order;
    });
    shape.addChild = child => getMesh(m => {
        m.add(child);
    });
    shape.manageArgs = manageArgs;
    shape.kill = _ => getMesh(m => {
        m.geometry.dispose();
        m.material.dispose();
        processes.forEach(proc => proc.kill());
        processes.length = 0;
        parentContainer.remove(shape);
    });
    shape.removeFromScene = _ => getMesh(m => {
        parentContainer.remove(shape);
    });
    shape.addToScene = _ => getMesh(m => {
        parentContainer.add(shape);
    });
    shape.pause = _ => {
        processes.forEach(proc => proc.pause());
    };
    shape.resume = _ => {
        processes.forEach(proc => proc.resume());
    };
    shape.isActive = _ => {
        if (!parentContainer.isActive()) return false;
        return parentContainer.hasChild(shape);
    };
    shape.parent = name => {
        parentContainer = containers[name];
        return shape;
    };
    /*
     * go::(void->bool)->Mesh
     * 実行時点までの変更内容を登録し、そのMeshをSceneに登録します。
     * 引数にはMeshの削除条件を記します。
     */
    shape.go = f => {
        const progress = progressManager.push("mesh");
        parentContainer.add(shape);
        createGeom(geom => {
            progress(0.5);
            createMaterial(mat => {
                progress(1);
                const mesh = createMesh(geom, mat);
                setMesh(mesh);
                const init = a => {
                    if (a instanceof THREE.Scene) {
                        a.children.forEach(c => init(c));
                    } else {
                        a.frustumCulled = false;
                    }
                };
                init(mesh);
            });
        });
        return shape;
    };
    return [getMesh, manageArgs, getMaterial];
};
