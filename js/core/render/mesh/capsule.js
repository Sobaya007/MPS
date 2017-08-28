"use strict";
window.makeCapsule = makeImplMesh => {
    const createCapsuleGeometry = (radius, cylinderHeight, segmentsRadius, segmentsHeight) => {
        var geometry = new THREE.CylinderGeometry(radius, radius, cylinderHeight, segmentsRadius, segmentsHeight, true),
        upperSphere = new THREE.Mesh(new THREE.SphereGeometry(radius, segmentsRadius, segmentsHeight, 0, Math.PI*2, 0, Math.PI/2)),
        lowerSphere = new THREE.Mesh(new THREE.SphereGeometry(radius, segmentsRadius, segmentsHeight, 0, Math.PI*2, Math.PI/2, Math.PI/2));
        upperSphere.position.set(0, cylinderHeight/2,0);
        lowerSphere.position.set(0,-cylinderHeight/2,0);
        THREE.GeometryUtils.merge(geometry, upperSphere);
        THREE.GeometryUtils.merge(geometry, lowerSphere);
        return geometry;
    };
    return _ => {
        const createGeom = cont => cont(createCapsuleGeometry(radius,V.distance(start, end),10,10));
        const implMesh = makeImplMesh(createGeom);

        let radius = 10;
        const start = V.vec(0,-50,0);
        const end = V.vec(0,50,0);
        const o = {};
        implMesh(o);

        /*
         * radius::float->Cylinder
         */
        o.radius = r => {
            radius = r;
            return o;
        };

        /*
         * start::(V,V,V)->Cylinder
         */
        o.start = (x,y,z) => {
            if (x !== null) start.x = x;
            if (y !== null) start.y = y;
            if (z !== null) start.z = z;
            return o;
        };

        /*
         * end::(V,V,V)->Cylinder
         */
        o.end = (x,y,z) => {
            if (x !== null) end.x = x;
            if (y !== null) end.y = y;
            if (z !== null) end.z = z;
            return o;
        };
        return o;
    };
};
