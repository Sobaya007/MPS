/*
 * 光源を表します。
 * SpotLightは必要ないと思ったので未定義です。
 */
"use strict";
window.makeLightBulider = (add, containers) => {
    const implementsLight = (l, createLight) => {
        const [_getLight, setLight] = U.makeLazy();
        const processes = [];
        let parentContainer = containers.root3d;
        const getLight = (f, name) => {
            _getLight(f, name);
            return l;
        };
        l.getMesh = getLight;
        l.add = (step, name) => getLight(l3 => {
            const proc = add(_ => step(l.kill), name);
            processes.push(proc);
            if (!l.isActive()) proc.pause();
        });
        const manageArgs = U.makeManageArgs(l.add);
        /*
         * color::(V,V,V)->Light
         * 光の色に関するsetterです。
         */
        l.color = manageArgs((r,g,b) => getLight(l3 => {
            l3.color.setRGB(r,g,b);
        }), "color in light");

        l.kill = _ => getLight(_ => {
            processes.forEach(proc => proc.kill());
            processes.length = 0;
            parentContainer.remove(l);
        });
        l.removeFromScene = _ => getLight(_ => {
            parentContainer.remove(l);
        });

        l.addToScene = _ => getLight(_ => {
            parentContainer.add(l);
        });
        l.pause = _ => {
            processes.forEach(proc => proc.pause());
        };
        l.resume = _ => {
            processes.forEach(proc => proc.resume());
        };
        l.isActive = _ => {
            if (!parentContainer.isActive()) return false;
            return parentContainer.hasChild(l);
        };
        l.parent = name => {
            parentContainer = containers[name];
            return l;
        };
        /*
         * 実行時点までの変更内容を登録し、そのLightをSceneに登録します。
         * 引数にはLightの削除条件を記述します。
         */
        l.go = f => {
            createLight(l3 => {
                parentContainer.addNow(l);
                setLight(l3);
            });
            return l;
        };
        return [getLight, manageArgs];
    };
    const o = {};
    /*
     * at::(V,V,V) -> PointLight
     * posを受け取り、点光源をその位置に置きます。
     */
    o.at = (x,y,z) => {
        const o = {};
        const [getLight, manageArgs] = implementsLight(o, cont => cont(new THREE.PointLight()));
        manageArgs((x,y,z) => getLight(l3 => {
            l3.position.set(x,y,z);
        }), "at in light");
        /*
         * intensity::V->PointLight
         * 光の強さに関するsetterです。
         */
        o.intensity = manageArgs(i => getLight(l3 => {
            l3.intensity = i;
        }), "intensity in light");
        /*
         * distance::V->PointLight
         * 影響のある距離に関するsetterです。
         */
        o.distance = manageArgs(d => getLight(l3 => {
            l3.distance = d;
        }), "distance in light");
        /*
         * decay::V->PointLight
         * 光の減衰の強さに関するsetterです。
         */
        o.decay = manageArgs(d => getLight(l3 => {
            l3.decay = d;
        }), "decay in light");
        return o;
    };
    /*
     * to::(V,V,V) -> DirectionalLight
     * dirを受け取り、平行光源をその向きに置きます。
     */
    o.to = (x,y,z) => {
        const o = {};
        const [getLight, manageArgs] = implementsLight(o, cont => cont(new THREE.DirectionalLight(0xffffff, 1)));
        getLight(l3 => {
            manageArgs((x,y,z) => {
                //ある程度離しておかないと、影がバグる
                l3.position.set(-x*20,-y*20,-z*20);
            }, "to in light");
            //影の設定
            l3.castShadow = true;
            l3.shadow.camera.left = -50;
            l3.shadow.camera.right = 50;
            l3.shadow.camera.top = 50;
            l3.shadow.camera.bottom = -50;
            l3.shadow.mapSize.width = 2048;
            l3.shadow.mapSize.height = 2048;
        });
        /*
         * intensity::V->DirectionalLight
         * 光の強さに関するsetterです。
         */
        o.intensity = manageArgs(i => getLight(l3 => {
            l3.intensity = i;
        }), "intensity in light");
        return o;
    };
    o.global = _ => {
        const o = {};
        implementsLight(o, cont => cont(new THREE.AmbientLight(0xffffff)));
        return o;
    };
    return o;
};
