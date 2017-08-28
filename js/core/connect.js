"use strict";
window.makeSocket = (host, port) => {
    const o = {};
    let ws;
    let tasks = []; //{isAccept:条件を満たせばtrueそうでなければfalseを返す関数,acceptInfo:リスナー関数}の配列
    o.resetConnectTasks = _ => {
        tasks = [];
    };
    o.pushConnectTask = task => {
        tasks.push(task);
        task.cond = info => true;
        return {
            on: cond => {
                task.cond = cond;
            }
        };
    };
    let onOpens = [];
    const exec = f => {
        if(onOpens) {
            onOpens.push(f);
        } else {
            f();
        }
    };
    o.connect = _ => {
        ws = new WebSocket("ws://" + host + ":" + port); //アドレス入れる
        ws.binaryType = "arraybuffer";
        ws.onopen = e => {
            setTimeout(_ => {
                onOpens.forEach(f => f());
                onOpens = null;
            }, 1000);
        };
        ws.onmessage = onMessage;
    };
    o.disconnect = _ => {
        onOpens = [];
        ws.close(4500, "reset");
        ws.onclose = () => {};
    };
    o.sendData = data => exec(_ => {
        //console.log(data);
        ws.send(data);
    });
    const onMessage = function (e) { //サーバーからデータを受け取る関数。引数はサーバーから送ってきた情報。戻り値はなし
        tasks.forEach(task => {
            if(task.cond(e)) task(e);
        });
    };
    return o;
};
