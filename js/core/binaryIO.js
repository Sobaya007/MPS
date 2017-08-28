/* global msgpack */
"use strict";
window.makeLoadBinary = makeLoad => {
    const loader = new THREE.XHRLoader();
    loader.setResponseType("blob");
    return makeLoad((path, cont, onProgress) => loader.load(path, cont, onProgress), (res, save) => {
        const fileReader = new FileReader();
        const [blob] = res;
        fileReader.onloadend = e => {
            const arraybuffer = fileReader.result;
            const array = new Uint8Array(arraybuffer);
            const unpacked = msgpack.unpack(array);
            save(unpacked);
        };
        fileReader.readAsArrayBuffer(blob);
    });
};
window.saveBinary = (obj, filename) => {
    const packed = msgpack.pack(obj);
    const binArray = new Uint8Array(packed);
    const blob = new Blob([binArray], {
        type: "application/octet-binary"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.target = "_blank";
    a.download = filename;
    a.click();
};
