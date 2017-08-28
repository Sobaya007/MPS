/*
 * モデルの読み込まれたデータを表します。
 * ModelはこのModelDataをもとに複製して作られます。
 */
"use strict";
window.makeMakeLoadModel = (rootPath, makeLoad, loadBinary) => {
    const makeLoadModel = (makeModel, models) => {
        const loadSingleModel = makeLoadSingleModel(makeLoad);
        const loadMultiModel = makeLoadMultiModel(loadBinary, makeLoad);
        const loadAnimationData = makeLoadAnimationData(makeLoad);
        const loadModel = (params) => {
            console.assert(params.path);
            let getAnimation;
            let getModel;
            const modelPath = rootPath + "model/" + params.path; 
            const animPath = modelPath.match(/(.*)(?:\.([^.]+$))/)[1] + "_actionlist.json";
            const o = {
                /*
                 * into::string->void
                 * nameを受け取り、その名前でSceneに登録します。
                 */
                into : id => {
                    models[id] = params;
                    return o;
                },

                /*
                 * make::void->Model
                 * ModelDataをもとにModelを作成します。
                 */
                make : _ => {
                    const exec = f => {
                        getAnimation(animData => {
                            getModel(model => {
                                f(model, animData);
                            });
                        });
                    };
                    const m = makeModel(exec);
                    return m;
                },
                path : modelPath
            };
            //アニメーションの区切り目をファイルから読み取る
            //ないとは思うが万が一ここの処理がモデル読み込みがあるとバグる
            if (params.hasAnimation) {
                getAnimation = loadAnimationData(animPath);
            } else {
                getAnimation = cont => cont(undefined);
            }

            if (params.dummy) {
                const cube = new THREE.Mesh(new THREE.CubeGeometry(20, 20, 20), new THREE.MeshPhongMaterial({color : 0xcfcfcf}));
                getModel = cont => cont(cube);
            } else {
                if (params.multi) {
                    getModel = loadMultiModel(modelPath, getAnimation, params.isBinary);
                } else {
                    getModel = loadSingleModel(modelPath);
                }
            }
            return o;
        };

        return loadModel;
    };

    //animPathに記載されたJSONのデータを継続に投げる
    //その際、endFrameプロパティも追加する。
    const makeLoadAnimationData = makeLoad => {
        const xhrLoader = new THREE.XHRLoader();
        const onLoad = (res, save) => {
            const animData = JSON.parse(res);
            save(animData);
        };
        const load = makeLoad((path, cont, onProgress) => xhrLoader.load(path, cont, onProgress), onLoad);
        const getAnimation = animPath => load(animPath);
        return getAnimation;
    };

    const makeLoadMultiModel = (loadBinary, makeLoad) => {
        const onLoad = (res, save, hasAnimation) => {
            const [scene] = res;
            if (hasAnimation) {
                setMorphTargets(scene);
            }
            scene.children.map(child => child.material).forEach(material => {
                if (material.materials) {
                    material.materials.forEach(m => m.side = THREE.DoubleSide);
                } else {
                    material.side = THREE.DoubleSide;
                }
            });
            save(scene);
        };
        const loadBinaryModel = makeLoad((path, cont, onProgress) => {
            const getJson = loadBinary(path);
            getJson(json => {
                const tmp = path.split("/");
                tmp.length--;
                const objectLoader = new THREE.ObjectLoader();
                objectLoader.texturePath = tmp.reduce((a,b) => a + "/" + b) + "/";
                objectLoader.parse(json, cont, onProgress);
            });
        }, onLoad);
        const loadJsonModel = makeLoad((path, cont, onProgress) => new THREE.ObjectLoader().load(path, cont, onProgress), onLoad);
        const setMorphTargets = scene => {
            //モデルのアニメーション用に必要
            scene.children.forEach(c => {
                c.material.morphTargets = true;
                if (c.material.materials) {
                    c.material.materials.forEach(m => m.morphTargets = true);
                }
            });
        };
        const loadMultiModel = (modelPath, getAnimation, isBinary) => {
            const hasAnimation = getAnimation ? true : false;
            if (isBinary) {
                return loadBinaryModel(modelPath, hasAnimation);
            } else {
                return loadJsonModel(modelPath, hasAnimation);
            }
        };
        return loadMultiModel;
    };

    const makeLoadSingleModel = makeLoad => {
        const jsonLoader = new THREE.JSONLoader();
        const onLoad = (res, save) => {
            const [geom, mat] = res;
            save(new THREE.Mesh(geom, new THREE.MeshFaceMaterial(mat)));
        };
        return makeLoad((path, cont, onProgress) => jsonLoader.load(path, cont, onProgress), onLoad);
    };
    return makeLoadModel;
};
