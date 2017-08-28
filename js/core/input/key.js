/*
 * キー入力を支配します。
 */
window.makeKeyItems = _ => {
    const makeKey = _ => {
        let on = true;
        let isPressing = false;
        const state = _ => on;
        const setIsPressing = p => isPressing = p;
        const o = {
            /*
             * isDown::bool
             * キーが押されているかを表します。
             */
            isDown : false,
            /*
             * isUp::bool
             * キーが離されているかを表します。
             * 両方ともは要らない気がしますが、そこはそばやの趣味です。
             */
            isUp   : true,
            /*
             * onDown::string->void
             * キーを押したときのEvnetListenerです。
             */
            onDown : _ => {
            },
            /*
             * onUp::string->void
             * キーを離したときのEvnetListenerです。
             */
            onUp : _ => {
            },
            on : _ => {
                on = true;
                o.isDown = isPressing;
                o.isUp = !isPressing;
            },
            off : _ => {
                on = false;
                o.isDown = false;
                o.isUp = true;
            },
        };
        return {
            o : o,
            state : state,
            setIsPressing : setIsPressing
        };
    };
    const keynames = [];
    const keySet = {};
    const keyFuncSet = {};
    const keyWithPred = [];
    "abcdefghijklmnopqrstuvwxyz".split("").forEach(c => keynames.push(c));
    keynames.push("ArrowLeft");
    keynames.push("ArrowRight");
    keynames.push("ArrowUp");
    keynames.push("ArrowDown");
    keynames.push("Enter");
    keynames.push("Backspace");
    keynames.push("Escape");
    keynames.push("Space");
    keynames.forEach(n => keyFuncSet[n] = makeKey());
    keynames.forEach(n => keySet[n] = keyFuncSet[n].o);
    /*
     * match:(string->bool)->KeyListenerSet
     * 引数としてpredを受け取り、入力キーがpredを満たすとき実行されるようなリスナーを持つKeyListenerSetを返します。
     */
    keySet.match = pred => {
        const key = makeKey();
        keyWithPred.push({
            key : key,
            pred : pred
        });
        return key;
    };
    const registerKeyListeners = _ => {
        document.onkeydown = e => {　
            let keyName = e.key;
            if (keyName === " ") keyName = "Space";
            //keyNameに紐づけられたKeyの処理
            const key = keyFuncSet[keyName];
            if (key) {
                //Keyの押下状態を更新
                e.preventDefault();
                key.setIsPressing(true);
                if (key.state()) {
                    key.o.isDown = true;
                    key.o.isUp = false;
                    //リスナーを実行
                    key.o.onDown(keyName);
                }
            }
            //条件に紐づけられたKeyの処理
            keyWithPred.forEach(o => {
                if (!o.pred(keyName)) return;
                o.key.setIsPressing(true);
                if (o.key.state()) {
                    o.key.o.isDown = true;
                    o.key.o.isUp = false;
                    o.key.o.onDown(keyName);
                }
            });
        };
        document.onkeyup = e => {
            let keyName = e.key;
            if (keyName === " ") keyName = "Space";
            //keyNameに紐づけられたKeyの処理
            const key = keyFuncSet[keyName];
            if (key) {
                //Keyの押下状態を更新
                e.preventDefault();
                key.setIsPressing(false);
                if (key.state()) {
                    key.o.isDown = false;
                    key.o.isUp = true;
                    //リスナーを実行
                    key.o.onUp(keyName);
                }
            }
            //条件に紐づけられたKeyの処理
            keyWithPred.forEach(o => {
                if (!o.pred(keyName)) return;
                o.key.setIsPressing(false);
                if (o.key.state()) {
                    o.key.o.isDown = false;
                    o.key.o.isUp = true;
                    //リスナーを実行
                    o.key.o.onUp(keyName);
                }
            });
        };
    };
    return [keySet, registerKeyListeners];
};
