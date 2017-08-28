"use strict";
window.makeMakeContainer = (add, containers) => {
    const makeContainer = parent => {
        if ((typeof parent) === "string") {
            parent = containers[parent];
        }
        const scene = (parent instanceof THREE.Scene) ? parent : new THREE.Scene();
        let children = [];
        const o = {};
        o.into = name => {
            containers[name] = o;
            o.name = name;
        };
        o.add = mesh => {
            children.push(mesh);
            mesh.pause();
            mesh.getMesh(m => {
                scene.add(m);
                mesh.resume();
            });
        };
        o.addNow = mesh => {
            children.push(mesh);
            mesh.pause();
            mesh.getMesh(m => {
                scene.add(m);
                mesh.resume();
            });
        };
        o.remove = mesh => {
            children = children.filter(m => m !== mesh);
            mesh.pause();
            mesh.getMesh(m => {
                scene.remove(m);
                mesh.pause();
            });
        };
        o.hasChild = mesh => {
            let res = false;
            mesh.getMesh(m => {
                res = scene.children.indexOf(m) !== -1;
            });
            return res; //getMeshの起動が遅延した場合は必ずfalseを返す
        };
        o.hasContainer = c => {
            return children.indexOf(c) !== -1;
        };
        o.addToScene = _ => {
            parent.add(o);
            if (o.isActive()) {
                children.forEach(m => m.resume());
            }
        };
        o.removeFromScene = _ => {
            parent.remove(o);
            children.forEach(m => m.pause());
        };
        o.clear = _ => {
            scene.children.length = 0;
            children.length = 0;
        };
        o.getMesh = cont => cont(scene);
        o.isRoot = _ => parent instanceof THREE.Scene;
        o.isActive = _ => {
            if (o.isRoot()) return true;
            if (!parent.hasContainer(o)) return false;
            return parent.isActive();
        };
        o.resume = _ => children.forEach(m => m.resume());
        o.pause = _ => children.forEach(m => m.pause());
        o.render = (camera, target) => {
            target.getTarget(tex => {
                GV.render2(scene, camera, tex);
            });
        };
        return o;
    };
    return makeContainer;
};
