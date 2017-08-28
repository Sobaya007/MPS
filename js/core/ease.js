"use strict";
window.makeEase = _ => {
    const e = {};

    e.make = fst => {
        const o = {};

        let t = 0;
        let [inputS, inputE] = [0, 1];
        let [outputS, outputE] = [fst, fst];
        let f = x => x;
        let callbackCnt = -1;
        let onStep;
        let origin;
        let killFlag = false;

        const callbacks = [];
        const step = kill => {
            if (!origin) {
                origin = {};
                origin.inputS = inputS;
                origin.inputE = inputE;
                origin.outputS = outputS;
                origin.outputE = outputE;
                origin.f = f;
                origin.onStep = onStep;
                origin.killFlag = killFlag;
            }
            if (t > inputE) kill();
            if (onStep) onStep(o.value());
            if (callbackCnt >= 0
                    && callbackCnt < callbacks.length) {
                const ccb = callbacks[callbackCnt];
                if (ccb[0] === t++) {
                    ccb[1]();
                    callbackCnt++;
                }
            } else {
                t++;
            }
            if (killFlag) kill();
        };
        const val = (s,e) => f(Math.max(0, Math.min(1, (t-inputS)/(inputE-inputS)))) * (e-s) + s;

        if (fst instanceof Object) {
            Object.keys(fst).forEach(k => {
                o[k] = {
                    parent : o,
                    value : _ => o.value()[k]
                };
            });
        }

        //===================評価関数===================
        o.value = s => {
            if (s !== undefined) t = s;
            if (fst instanceof Object) {
                let r = {};
                Object.keys(fst).forEach(k => {
                    r[k] = val(outputS[k], outputE[k]);
                });
                return r;
            } else {
                return val(outputS, outputE);
            }
        };
        o.step = step;

        //===================基本関数操作===================
        //(int -> V) -> (void -> Ease)
        const baseFunc = func => _ => {
            f = func;
            return o;
        };
        o.linear = baseFunc(x => x);
        o.quad = baseFunc(x => x*x);
        o.cubic = baseFunc(x => x*x*x);
        o.quart = baseFunc(x => x*x*x*x);
        o.quint = baseFunc(x => x*x*x*x*x);
        o.sine = baseFunc(x => 1 - Math.cos(x*Math.PI/2));
        o.circ = baseFunc(x => 1 - Math.sqrt(Math.max(0, 1-x*x)));
        o.exp = baseFunc(x => Math.pow(2, -(1-x)*10));
        o.back = baseFunc(x => x*x*(2.70158*x-1.70158));
        o.softBack = baseFunc(x => x*x*(2*x-1));
        o.pow = n => {
            f = x => Math.pow(x, n);
            return o;
        };

        //=====================関数変更====================
        //((int -> V) -> (int -> V))-> (void -> Ease)
        const composeFunc = func => _ => baseFunc(func(f))();
        o.out = composeFunc(f => x => 1-f(1-x));
        o.inout = composeFunc(f => x => {
            if(x < 0.5){
                return f(x*2)/2;
            }else{
                return 1-f(2-2*x)/2;
            }
        });
        o.mirror = composeFunc(f => x => {
            if(x < 0.5){
                return f(x*2);
            }else{
                return f(2-2*x);
            }
        });
        o.reverse = composeFunc(f => x => {
            if(x < 0.5){
                return f(x*2);
            }else{
                return 1 - f(2*x-1);
            }
        });

        //===================入力変更=====================
        o.inRange = (s,e) => {
            inputS = s;
            inputE = e;
            return o;
        };
        o.wait = w => o.inRange(w, w + inputE - inputS);
        o.period = p => o.inRange(inputS, inputS + p);

        //===================出力変更===================
        o.outRange = (s,e) => {
            outputS = s;
            outputE = e;
            t = 0;
            return o;
        };
        o.from = frm => o.outRange(frm, outputE);
        o.to = a => o.outRange(o.value(), a);

        //===================リスナー====================
        o.repeat = _ => o.on(1, _ => {
            o.reset();
            callbackCnt = -1;
        });

        o.on = (rate, callback) => {
            const frame = Math.ceil(rate * (inputE - inputS) + inputS);
            callbacks.push([frame,callback]);
            callbackCnt = 0;
            return o;
        };

        o.onStep = callback => {
            const pre = onStep;
            onStep = v => {
                if (pre)
                    pre(v);
                callback(v);
            };
            return o;
        };

        //====================状態変化関数======================
        o.reset = _ => {
            t = 0;
            if (callbackCnt >= 0)
                callbackCnt = 0;
            inputS = origin.inputS;
            inputE = origin.inputE;
            outputS = origin.outputS;
            outputE = origin.outputE;
            f = origin.f;
            onStep = origin.onStep;
            killFlag = origin.killFlag;
            return o;
        };

        o.kill = _ => killFlag = true;

        return o;
    };

    return e;
};
