
const start = _ => {
    Core.Scene("Title", s => {

        s.onStart = _ => {
            s.text()
                .text("Press Mouse to Start!")
                .color(1,1,1)
                .sizeH(100)
                .go();
            s.mouse.left.onDown = _ => {
                s.to("main", kill => {
                    kill();
                });
            };
        };
    });

    Core.Scene("main", s => {
        s.onStart = _ => {
            const starttime = new Date();
            const FIELD = 200;
            const WAVE_NUM = 30;
            const ITEM_NUM = 10;
            const xs = [];
            const ys = [];
            const rs = [];
            const waves = [];
            let items = [];
            let itemCnt = 0;
            const initWave = i => {
                xs.push(114514);
                ys.push(114514);
                rs.push(0);
                const wave = {
                    step: _ => {
                        rs[i] += 1;
                    }
                };
                waves.push(wave);
            };
            let cnt = 0;
            const makeWave = (x,y) => {
                const i = cnt;
                xs[i] = x;
                ys[i] = y;
                rs[i] = 0;
                cnt = (cnt + 1) % WAVE_NUM;
            };
            for (let i = 0; i < WAVE_NUM; i++) {
                initWave(i);
            }
            s.plane()
                .size(FIELD*2, FIELD*2)
                .shader(sh => {
                    sh.vsGen({
                        position: true
                    })
                        .fsFromPath("grid.frag")
                        .uniform({
                            xs: _ => xs,
                            ys: _ => ys,
                            rs: _ => rs,
                        })
                })
                .go();
            s.text()
                .text("Catch the stone!!")
                .center(0,70)
                .sizeH(50)
                .color(1,1,1)
                .go();

            s.text()
                .text("[    ]")
                .color(1,1,1)
                .sizeH(s.ease.make(50).wait(30).period(40).to(60).cubic().mirror().repeat())
                .go();

            s.text()
                .text(_ => "" + Math.floor((30 - (new Date() - starttime) / 1000) * 100) / 100)
                .color(1,1,1)
                .center(-120, 70)
                .sizeW(50)
                .go();

            s.text()
                .text(_ => "" + itemCnt + " / " + ITEM_NUM)
                .color(1,1,1)
                .center(120, 70)
                .sizeH(50)
                .go();

            const makeItem = (x,y) => {
                let cx = x;
                let cy = y;
                let angle = 0;
                let time = 0;
                let flag;
                const o = {};
                let dead = false;
                const mesh = s.plane() 
                    .center(_ => x, _ => y,1)
                    .rotate(0, 0, 1, _ => angle)
                    .size(5,5)
                    .dif(1,1,1)
                    .add(kill => {
                        const H = 10;
                        if (flag) {
                            let t = time / 30;
                            t = t * t * (3 - 2 * t);
                            x = cx;
                            y = cy + t * H * 2;
                            angle = 360 * t;
                            if (t >= 1) {
                                kill();
                                mesh.kill();
                                dead =true;
                            }
                            time++;
                        } else {
                            const P0 = 100;
                            const P1 = 140;
                            const P2 = 150;
                            const P3 = 200;
                            if (time < P0) {
                                x = cx + (Math.random() - 0.5) * 1;
                                y = cy + H * time / P0;
                            } else if (time < P1) {
                                x = cx;
                                const t = (time - P0) / (P1 - P0);
                                angle = t * t * (3 - 2 * t) * 180;
                            } else if (time < P2) {
                                const t = (time - P1) / (P2 - P1);
                                y = cy + H * (1 - t * t);
                            }
                            if (time == P2) {
                                makeWave(x,y);
                            }
                            time = (time + 1) % P3;
                        }
                        o.x = x;
                        o.y = y;
                    })
                    .go();
                o.x = cx;
                o.y = cy;
                o.kill = _ => {
                    if (flag) return false;
                    flag = true;
                    time = 0;
                    return true;
                }
                o.dead = _ => dead;
                items.push(o);
            }
            for (let i = 0; i < ITEM_NUM; i++) {
                makeItem(
                    (Math.random() - 0.5) * (FIELD - 70) * 2,
                    (Math.random() - 0.5) * (FIELD - 70) * 2);
            }

            let spd = V.vec(0,0,0);
            s.add(_ => {
                waves.forEach(wave => wave.step());
                spd.x += s.mouse.pos.x * 0.01;
                spd.y += s.mouse.pos.y * 0.01;
                spd.x *= 0.9;
                spd.y *= 0.9;
                GV.camera3d.position.x += spd.x;
                GV.camera3d.position.y += spd.y;
                const PO = FIELD - 50;
                if (GV.camera3d.position.x > PO) {
                    GV.camera3d.position.x = PO;
                    if (spd.x > 0) spd.x *= -0.9;
                }
                if (GV.camera3d.position.y > PO) {
                    GV.camera3d.position.y = PO;
                    if (spd.y > 0) spd.y *= -0.9;
                }
                if (GV.camera3d.position.x < -PO) {
                    GV.camera3d.position.x = -PO;
                    if (spd.x < 0) spd.x *= -0.9;
                }
                if (GV.camera3d.position.y < -PO) {
                    GV.camera3d.position.y = -PO;
                    if (spd.y < 0) spd.y *= -0.9;
                }

                items = items.filter(item => {
                    const dx = GV.camera3d.position.x - item.x;
                    const dy = GV.camera3d.position.y - item.y;
                    if ((dx * dx + dy * dy) < 10) {
                        if (item.kill()) {
                            itemCnt++;
                            if (itemCnt == ITEM_NUM) {
                                returnFlag = false;
                                s.to("Clear", kill => {
                                    killMain = kill;
                                }, (new Date() - starttime) / 1000);
                            }
                        }
                    }
                    return !item.dead();
                });
                if (30 - (new Date() - starttime) / 1000 <= 0) {
                    s.to("GameOver", kill => {
                        killMain = kill;
                    }, itemCnt);
                }
            });
        };
    });

    let killMain;

    Core.Scene("Clear", s => {
        s.onStart = time => {
            s.text()
                .text("Congratulation!!")
                .color(1,0,0)
                .sizeH(100)
                .go();
            s.text()
                .text("Press t to tweet")
                .color(1,0,0)
                .center(0,-50)
                .sizeH(100)
                .go();

            s.mouse.left.onDown = _ => {
                s.to("Title", kill => {
                    kill();
                    killMain();
                });
            };
            s.key.t.onDown = _ => {
                window.open('https://twitter.com/intent/tweet?text=' + time + '秒で優勝した。&url=http://jam0828.sobaya007.trap.show/&hashtags=traP3jam', '_blank');
            };
        };
    });

    Core.Scene("GameOver", s => {
        s.onStart = itemCnt => {
            s.text()
                .text("Game Over!!")
                .color(1,0,0)
                .sizeH(100)
                .go();
            s.text()
                .text("Press t to tweet")
                .color(1,0,0)
                .sizeH(100)
                .center(0,-50)
                .go();

            s.mouse.left.onDown = _ => {
                s.to("Title", kill => {
                    kill();
                    killMain();
                });
            };
            s.key.t.onDown = _ => {
                window.open('https://twitter.com/intent/tweet?text=' + itemCnt + '個で終了。&url=http://jam0828.sobaya007.trap.show/&hashtags=traP3jam', '_blank');
            };
        };
    });


    Core.Launch("Title");
};
