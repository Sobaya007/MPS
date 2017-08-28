/*
 * 便利関数まとめ
 */

"use strict";
window.U = (() => {
    const u = {};

    /*
     * makeRotationFromTo::(vec, vec)->mat
     * 回します
     */
    u.makeRotationFromTo = (a, b) => {
        const axis = new THREE.Vector3().crossVectors(a,b).normalize(); 
        const angle = Math.acos(a.dot(b));
        return new THREE.Matrix4().makeRotationAxis(axis, angle);
    };
    u.makeReplacement = (x,y,z) => {
        const m = new THREE.Matrix4(); 
        m.elements[0] = x.x;
        m.elements[1] = x.y;
        m.elements[2] = x.z;
        m.elements[3] = 0;
        m.elements[4] = y.x;
        m.elements[5] = y.y;
        m.elements[6] = y.z;
        m.elements[7] = 0;
        m.elements[8] = z.x;
        m.elements[9] = z.y;
        m.elements[10] = z.z;
        m.elements[11] = 0;
        m.elements[12] = 0;
        m.elements[13] = 0;
        m.elements[14] = 0;
        m.elements[15] = 1;
        return m;
    };
    /*
     * reduce::([a], (a,a)->b)->b
     * 畳みます。
     */
    u.reduce = (array, func) => {
        let val = array[0];
        for (let i = 1; i < array.length; i++) {
            val = func(val, array[i]);
        }
        return val;
    };

    /*
     * filter::([a], a->bool)->[a]
     * フィルターします。
     */
    u.filter = (array, pred) => {
        let val = [];
        for (let i = 0; i < array.length; i++) {
            if (pred(array[i]))
                val.push(array[i]);
        }
        return val;
    };

    /*
     * all::([a], a->bool)->bool
     * 全部が条件を満たしたらtrue
     */
    u.all = (array, pred) => {
        for (let i = 0; i < array.length; i++) {
            if (!pred(array[i])) return false;
        }
        return true;
    };

    /*
     * any::([a], a->bool)->bool;
     * 1つでも条件を満たしたらtrue
     */
    u.any = (array, pred) => !u.all(array, x => !pred(x));

    /*
     * map::([a], a->b)->[b]
     * 全部変換
     */
    u.map = (array, func) => {
        let val = [];
        for (let i = 0; i < array.length; i++) {
            val.push(func(array[i]));
        }
        return val;
    };

    /*
     * dropTail::[a]->[a]
     * ケツだけ落とす
     */
    u.dropTail = array => {
        let val = [];
        for (let i = 0; i < array.length-1; i++) {
            val.push(array[i]);
        }
        return val;
    };

    /*
     * last::[a]->a
     * ケツ
     */
    u.last = array => array[array.length-1];
    //アロー関数内ではargumentsが使えなかった
    /*
     * makeManageArgs::(((void->void)->void)->void, void->bool)->(([V], ([V]->void))->void)
     * addを受け取って、manageArgsを返す関数です。
     * manageArgs::([V], ([V]->void))->void
     *                     V = float | Ease
     * manageArgsは、引数リストと関数を受け取る関数です。
     * 引数リストの中のものの型はfloatかEaseかのどちらかで、
     * floatだった場合にはそのまま関数に適用し、
     * Easeだった場合にはそれを更新しながら毎フレーム関数に適用するようにします。
     */
    u.makeManageArgs = add => (f, name) => function(...args) {
        let isDynamic = false;
        const a = [];
        args.forEach((e, idx) => {
            const isFunction = e => typeof e === "function";
            const isEase = e => e instanceof Object && e.value && typeof e.value === "function";
            if (isEase(e)) {
                isDynamic = true;
                const assign = _ => a[idx] = e.value();
                add(assign, "manage args update easing" + name);
                assign();

                if (e.step) add(e.step, "manage args step");
            } else if (isFunction(e)) {
                isDynamic = true;
                const assign = _ => a[idx] = e(a[idx]);
                add(assign, "manage args update function : " + name);
                assign();
            } else {
                a[idx] = e;
            }
        });
        if (isDynamic) {
            add(kill => { //step for applying realArgs
                f(...a);
            }, "manage args applying args : " + name);
        }
        return f(...a);
    };
    u.makeLazy = _ => {
        let value;
        const onLoad = [];
        const get = cont => {
            if (value) {
                cont(value);
            } else {
                onLoad.push(cont);
            }
        };
        const set = v => {
            value = v;
            onLoad.forEach(f => f(v));
            onLoad.length = 0;
        };
        return [get, set];
    };
    u.makeMakeLoad = progressManager => (load, cont = (res, save) => save(...res)) => {
        const dictionary = {};
        const res = (path, extraInfo) => {
            if (dictionary[path])
                return dictionary[path];
            const progress = progressManager.push(load);
            const onProgress = xhr => {
                if(!xhr.lengthComputable) return;
                const rate = xhr.loaded / xhr.total;
                progress(rate);
            };
            const [get, set] = u.makeLazy();
            load(path, (...e) => {
                progress(1);
                cont(e, set, extraInfo);
            }, onProgress);
            return dictionary[path] = get;
        };
        return res;
    };
    return u;
})();
