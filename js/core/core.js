/*
 * 諸機能を提供する大本のオブジェクトです。
 */
/* global makeScene, makeEase, makeMakeProcess, makeProgressManager
  makeLoadBinary, makeMakeLoadModel, makeMakeLoadImage, makeMakeLoadSound, makeMakeLoadText, makeMakeContainer */
"use strict";
window.Core = (_ => {
    const rootPath = "./Resource/";
    let c = {};
    let scenes = {};
    let steps = [];
    let currentScenes = [];
    const progressManager = makeProgressManager();
    const makeLoad = U.makeMakeLoad(progressManager);
    const loadBinary = makeLoadBinary(makeLoad);
    const loadMakers = {
        loadBinary: loadBinary,
        makeLoadModel: makeMakeLoadModel(rootPath, makeLoad, loadBinary),
        makeLoadImage: makeMakeLoadImage(rootPath, makeLoad),
        makeLoadSound: makeMakeLoadSound(rootPath, makeLoad),
        makeLoadText: makeMakeLoadText("./", makeLoad)
    };
    const dictionaries = {
        image : {},
        sound : {},
        models : {},
        textContent : {},
    };
    const makeProcess = makeMakeProcess(p => steps.push(p));
    /*
     * Add :: ((void->void)->void)->void
     * stepを受け取り、毎フレーム実行するようにします。
     * 実行はCoreで行われます。
     * stepはkillを受け取るstep用関数です。
     */
    c.Add = step => {
        const proc = makeProcess(step);
        steps.push(proc);
        return proc;
    };
    const makeContainer = makeMakeContainer(c.Add, {});
    GV.root3d = makeContainer(GV.scene3d);
    GV.root2d = makeContainer(GV.scene2d);
    /*
     * Scene :: (string,Scene->void)->void
     * (name,onLoad)を受け取り、Sceneを保存します。
     */
    c.Scene = (name, onLoad) => {
        //ここで作られたSceneを殺す関数。
        //Sceneが停止すると同時に、そのシーンで定義た物体もTHREE.jsのSceneから除去されます。
        const kill = _ => {
            currentScenes = U.filter(currentScenes, scene => !(scene === s.scene));
            s.isRunning = false;
            s.scene.containers.root3d.removeFromScene();
            s.scene.containers.root2d.removeFromScene();
            s.scene.containers.root3d.clear();
            s.scene.containers.root2d.clear();
        };
        const s = makeScene(name, startScene, kill, loadMakers, dictionaries, progressManager);
        onLoad(s.scene);
        scenes[name] = s;
    };
    c.GetSceneProgress = name => scenes[name];
    /*
     * Launch :: string->void
     * sceneNameを受け取り、保存されたSceneを実行します。
     */
    c.Launch = sceneName => {
        //右クリックでのメニュー表示の停止
        document.oncontextmenu = _ => false;
        //stepList内の全stepを実行し、次の世代のstepListを返す
        const stepAll = stepList => {
            const nextList = [];
            for(let i = 0; i < stepList.length; i++) {
                const step = stepList[i];
                let alive = true;
                const kill = _ => {
                    alive = false;
                };
                step.proc(kill);
                if(alive) nextList.push(step);
            }
            return nextList;
        };
        const animate = _ => {
            requestAnimationFrame(animate); //次回の要求
            GV.clear();
            steps = stepAll(steps); //step
            currentScenes.forEach(cs => cs.steps = stepAll(cs.steps)); //step
            const printSteps = _ => {
              currentScenes.forEach(cs => {
                const a = {};
                cs.steps.map(a => a.name).forEach(name => {
                  if (a[name] === undefined) a[name] = 1;
                  else a[name]++;
                });
                console.log(a);
              });
            };
            GV.updateControl(); //Controlのstep
            GV.render(); //描画
        };
        startScene(sceneName, _ => {});
        animate(); //初期条件
    };
    /*
     * Ease::Ease
     * Core用のEaseです。実行はCoreで行われます。
     */
    c.Ease = makeEase(c.Add, c.Remove);
    //指定した名前のシーンを開始します。
    //その際、前に起動していたSceneが自動的に削除されることはありません。
    const startScene = (nextSceneName, fromPrev) => {
        const nextScene = scenes[nextSceneName].scene;
        nextScene.isRunning = true;
        currentScenes.push(nextScene);
        nextScene.containers.root3d.addToScene();
        nextScene.containers.root2d.addToScene();
        nextScene.onStart(fromPrev); //初期化リスナー
        nextScene.registerKeyListeners();
        nextScene.registerMouseListeners();
    };
    return c;
})();
