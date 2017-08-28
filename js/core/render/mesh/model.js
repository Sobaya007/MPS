/*
 * 3Dモデルを表します。
 * 2017/02/16現在、Blenderでのモデルの読み込みは観測しています。
 */
"use strict";
window.makeModel = (makeImplMesh, add, makeShader) => exec => {
    const o = {};
    let currentAnim;
    const [getAnimation, setAnimation] = U.makeLazy();
    exec((_, animData) => add(kill => {
        kill();
        getMesh(clone => {
            const animations = {};
            if(animData) {
                const mixer = new THREE.AnimationMixer(clone);
                setupAnimation(clone.children, animData, mixer, clone.animations ? clone.animations.map(clip => mixer.clipAction(clip)) : []);
                Object.keys(animData)
                    .forEach(groupName => {
                        const animationGroup = {
                            animations: {},
                            transit: animData[groupName].transit
                        };
                        Object.keys(animData[groupName].animations)
                            .forEach(animationName => {
                                animationGroup.animations[animationName] = makeAnimation(groupName, animationName, animData[groupName].animations[animationName]);
                            });
                        animations[groupName] = animationGroup;
                    });
            }
            setAnimation(animations);
        }, "model init2");
    }, "model init"));
    const createGeom = cont => {
        exec((scene, animData) => {
            const clone = scene.clone(true);
            //マテリアルはなぜかShallow Copyしかしない
            for(let i = 0; i < clone.children.length; i++) {
                const src = scene.children[i];
                const dst = clone.children[i];
                dst.material = src.material.clone();
            }
            cont(clone);
        });
    };
    const createMat = cont => cont();
    const createMesh = (geom, mat) => geom;

    const implMesh = makeImplMesh(createGeom, createMat, createMesh);
    const [getMesh, manageArgs, ] = implMesh(o);
    const shader = makeShader(manageArgs);
    const findAnimation = (animationGroups, animName) => {
        for(let groupName in animationGroups) {
            const group = animationGroups[groupName];
            for(let name in group.animations) {
                if(animName === name) {
                    return group.animations[name];
                }
            }
        }
        console.assert(false);
    };
    const getTransitPeriod = (animationGroups, nameStart, nameEnd) => {
        const startGroupName = findAnimation(animationGroups, nameStart)
            .groupName;
        const endGroupName = findAnimation(animationGroups, nameEnd)
            .groupName;
        const transit = animationGroups[startGroupName].transit;
        for(let i = 0; i < transit.length; i++) {
            if(transit[i].to === endGroupName) {
                return transit[i].time;
            }
        }
        return false;
    };
    /*
     * play::string->Model
     * animNameを引数にして、そのアニメーションを再生します。
     */
    o.play = animName => {
        getAnimation(animationGroups => {
            currentAnim = findAnimation(animationGroups, animName);
            console.assert(currentAnim);
        });
        return o;
    };
    o.getCurrentAnimation = _ => currentAnim;
    /*
     * to::(string, int)->Model
     * (animName, period)を引数にして、そのアニメーションにperiodかけて移行します。
     */
    o.to = (name, sync) => getAnimation(animationGroups => {
        if(!currentAnim.canTransit(name)) return;
        const period = getTransitPeriod(animationGroups, currentAnim.name, name);
        if(!period) return;
        currentAnim = mixAnimation(currentAnim, findAnimation(animationGroups, name), period, sync);
    });
    o.forceTo = name => getAnimation(animationGroups => {
        currentAnim = findAnimation(animationGroups, name);
        if(currentAnim !== undefined && currentAnim.frame !== undefined) currentAnim.frame = 0;
    });
    /*
     * @Override
     */
    o.shader = settings => getMesh(mesh => {
        const mat = [];
        mat.length = settings.length;
        let cnt = 0;
        const cont = i => m => {
            mat[i] = m;
            if(++cnt === settings.length) {
                mesh.material = new THREE.MeshFaceMaterial(mat);
            }
        };
        for(let i = 0; i < settings.length; i++) {
            const [s, create] = shader();
            settings[i](s);
            create(cont(i));
        }
    });
    const makeAnimation = (groupName, animName, animation) => {
        const loop = animation.loop;
        const startFrame = animation.startFrame - 1;
        const endFrame = animation.endFrame - 1;
        const frameLength = animation.endFrame - animation.startFrame + 1;
        const o = {
            name: animName,
            groupName: groupName,
            canTransit: name => animName !== name,
            frame: 0,
            getFrameAsAll: frame => {
                if(frame < 0) return startFrame;
                if(frame >= frameLength) return endFrame;
                return startFrame + frame;
            },
            setInfluence: (mesh, influence = 1) => {
                //現在のフレームがpとnの間にあるので、Influenceをその2つに配分
                const p = o.getFrameAsAll(Math.floor(o.frame));
                const n = o.getFrameAsAll(Math.ceil(o.frame));
                if(p === n) {
                    mesh.morphTargetInfluences[p] = influence;
                } else {
                    const rate = o.frame - Math.floor(o.frame);
                    mesh.morphTargetInfluences[p] = (1 - rate) * influence;
                    mesh.morphTargetInfluences[n] = rate * influence;
                }
            },
            stepFrame: delta => {
                o.frame += animation.playSpd * delta;
                if(o.frame >= frameLength) {
                    if(loop) {
                        o.frame -= frameLength;
                    } else {
                        o.frame = frameLength - 1;
                    }
                }
                return o;
            },
            isPlaying: _ => loop || o.frame < frameLength - 1
        };
        return o;
    };
    const mixAnimation = (animA, animB, transitPeriod, sync) => {
        if(sync) {
            animB.frame = animA.frame;
        } else {
            animB.frame = 0;
        }
        const o = {
            name: animB.name,
            canTransit: name => animB.canTransit(name),
            frame: 0,
            getFrameAsAll: frame => animA.getFrameAsAll(o.frame),
            setInfluence: (mesh, influence = 1) => {
                const rate = o.frame / transitPeriod;
                animA.setInfluence(mesh, (1 - rate) * influence);
                animB.setInfluence(mesh, rate * influence);
            },
            stepFrame: delta => {
                animA.stepFrame(delta);
                if(sync) {
                    animB.stepFrame(delta);
                }
                o.frame += delta;
                if(o.frame >= transitPeriod) {
                    o.frame = transitPeriod;
                    return animB;
                }
                return o;
            },
            isPlaying: _ => true
        };
        return o;
    };
    const setupAnimation = (meshes, animData, mixer, actions) => {
        const skinnedMeshses = meshes.filter(a => a instanceof THREE.SkinnedMesh);
        actions.forEach(action => action.play());
        //毎フレームステップ
        o.add(_ => {
            if(!currentAnim) return;
            currentAnim = currentAnim.stepFrame(0.02);
            skinnedMeshses.forEach(mesh => {
                mesh.morphTargetInfluences.fill(0);
                currentAnim.setInfluence(mesh);
                mesh.skeleton.update();
            });
            actions.forEach(action => action.time = currentAnim.getFrameAsAll() / 24);
            mixer.update(0.00114514);
        }, "model animation");
    };
    return o;
};
