/*
 * Sceneを表します。Sceneを使って生成されたものはそのSceneに所属し、stepやdrawが行われます。
 */
/* global Core, makeMakeImplementsShape, makeMakeImplementsMesh
   makeSprite, makeBillboard, makeBillLine, makeMakeCanvas, makeMakeShader,
   makeModel, makeLightBulider, makeImage, makeScreen,
   makeRect, makeRing, makeText, makeSphere, makeParametric,
   makePlane, makeCube, makeCapsule, makeCylinder, makeGrid, makePoints,
   makeAudio, makeEase, makeKeyItems, makeMouse, makeMakeProcess, makeMakeContainer
   registerMouseListeners
   */
"use strict";
window.makeScene = (sceneName, startScene, kill, loadMakers, dictionaries, progressManager) => {
    const s = {
        name: sceneName,
        /*
         * image::{string:Image}
         * 読み込まれたImageを格納しています。鍵はintoで登録された名前です。
         */
        image: dictionaries.image,
        /*
         * model::{string:ModelData}
         * 読み込まれたModeldataを格納しています。鍵はintoで登録された名前です。
         */
        model: {
            get: (name) => s.loadModel(models[name])
        },
        /*
         * textContent::{string:string}
         * 読み込まれたテキストのデータを格納しています。鍵はintoで登録された名前です。
         */
        textContent: dictionaries.textContent,
        sound: dictionaries.sound,
        containers: {},
        steps: [],
        isRunning: false
    };
    const makeProcess = makeMakeProcess(p => s.steps.push(p));
    /*
     * add::((void->void)->void)->void
     * stepを受け取り、毎フレーム実行するようにします。実行はそのSceneで行われます。
     * stepはkillを受け取るstep用関数です。
     */
    s.add = (step, name) => {
        const proc = makeProcess(step, name);
        s.steps.push(proc);
        return proc;
    };
    s.loadText = loadMakers.makeLoadText(s.textContent);
    //============便利グッズ==============
    s.allMeshShapeKill = _ => {};
    const makeShader = makeMakeShader(s.add, s.loadText);
    const makeImplShape = makeMakeImplementsShape(s.add, s.containers, makeShader, progressManager);
    const makeImplMesh = makeMakeImplementsMesh(s.add, s.containers, makeShader, progressManager);
    const makeContainer = makeMakeContainer(s.add, s.containers);
    s.containers.root3d = makeContainer(GV.root3d);
    s.containers.root2d = makeContainer(GV.root2d);
    const models = dictionaries.models;
    /*
     * onStart::void->void
     * Scene開始時に呼び出されるリスナーです。
     */
    s.onStart = _ => {
        console.assert(false);
    };
    /*
     * to::(string, (void->void)->void)->void
     * (sceneName, kill)を受け取り、そのSceneに移行します。
     * killを呼び出すと、移行前のSceneのStepが止まり、onStart内でTHREE.jsのsceneにaddされたものがすべてremoveされます。
     */
    s.to = (nextSceneName, onEnd, fromPrev) => {
        s.to = _ => {};
        Core.Add(killThis => {
            const killScene = _ => {
                killThis();
                kill();
            };
            onEnd(killScene);
        });
        startScene(nextSceneName, fromPrev);
        console.log("Started Scene '" + nextSceneName + "'");
    };
    s.allStepsKill = _ => {
        Core.Add(kill => {
            s.steps.length = 0;
            kill();
        });
        s.steps.length = 0;
    };
    const sprite = makeSprite(makeImplShape);
    const billboard = makeBillboard(makeImplMesh);
    const billLine = makeBillLine(makeImplMesh);
    const audio = makeAudio();
    const image = makeImage(sprite, billboard, billLine, s.image);
    /*
     * ease::Ease
     * Scene用のEaseです。実行はそのSceneで行われます。
     */
    s.ease = makeEase(s.add, s.remove);
    const keyItems = makeKeyItems();
    /*
     * key::KeySet
     * KeySetを表します。KeyEventはそのScene内でのみ発行されます。
     */
    s.key = keyItems[0];
    s.registerKeyListeners = keyItems[1];
    /*
     * mouse::Mouse
     * Mouseを表します。MouseEventはそのScene内でのみ発行されます。
     */
    s.mouse = makeMouse();
    s.registerMouseListeners = _ => {
        registerMouseListeners(s.mouse);
    };
    /*
     * loadImage::string->Image
     * pathを受け取り、Imageを返します。pathのrootは"/Resource/img/"です。
     */
    s.loadImage = loadMakers.makeLoadImage(image);
    /*
     * loadModel::string->ModelData
     * pathを受け取り、ModelDataを返します。pathのrootは"/Resource/model/"です。
     */
    s.loadModel = loadMakers.makeLoadModel(makeModel(makeImplMesh, s.add, makeShader), models);
    s.loadSound = loadMakers.makeLoadSound(audio, s.sound);
    s.canvas = makeMakeCanvas(sprite, billboard, billLine, s.image);
    /*
     * light::LightBuilder
     * LightBuilderを表します。
     */
    s.light = makeLightBulider(s.add, s.containers);
    /*
     * rect::void->Rect
     * Rectを返します。
     */
    s.rect = makeRect(makeImplShape);
    /*
     * ring::void->Ring
     * Ringを返します。
     */
    s.ring = makeRing(makeImplShape);
    /*
     * text::void->Text
     * Textを返します。
     */
    s.text = makeText(sprite, s.canvas);
    s.sprite = sprite;
    /*
     * plane::void->Plane
     * Planeを返します。
     */
    s.plane = makePlane(makeImplMesh);
    /*
     * cube::void->Cube
     * Cubeを返します。
     */
    s.cube = makeCube(makeImplMesh);
    s.sphere = makeSphere(makeImplMesh);
    s.capsule = makeCapsule(makeImplMesh);
    /*
     * cylinder::void->Cylinder
     * Cylinderを返します。
     */
    s.cylinder = makeCylinder(makeImplMesh);
    /*
     * grid::void->Grid
     * Gridを返します。
     */
    s.grid = makeGrid(makeImplMesh);
    s.parametric = makeParametric(makeImplMesh);
    s.points = makePoints(makeImplMesh);
    s.billboard = billboard;
    s.billLine = billLine;
    s.container = makeContainer;
    s.screen = makeScreen(image);
    s.progressManager = progressManager;
    return {
        scene: s
    };
};
