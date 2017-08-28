/*
 * Shaderを表します
 */
"use strict";
window.makeMakeShader = (add, loadText) => {
    const cache = {};
    return manageArgs => {
        return _ => {
            const params = {
                uniforms : {},
                transparent : true
            };
            let vsGenParams;
            const o = {};

            const def = f => e => {
                f(e);
                return o;
            };

            let getVS = cont => cont(
                    `void main() {
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1);
                    }`);

            let getFS;
            let name;

            o.into = n => {
                name = n;
                return o;
            };

            /*
             * vs::string->Shader
             * VertexShaderに関するsetterです。
             * ソースコードを引数に取ります。
             */
            o.vs = def(vs => getVS = cont => cont(vs));

            o.vsFromPath = def(path => {
                path = "shader/" + path;
                const textContent = loadText(path);
                getVS = cont => textContent.getText(text => {
                    cont(text);
                });
            });

            /*
             * fs::string->Shader
             * FragmentShaderに関するsetterです。
             * ソースコードを引数に取ります。
             */
            o.fs = def(fs => getFS = cont => cont(fs));

            o.fsFromPath = def(path => {
                path = "shader/" + path;
                const textContent = loadText(path);
                getFS = cont => textContent.getText(text => {
                    cont(text);
                });
            });

            /*
             * vsGen::object->Shader
             * paramを引数にとり、VertexShaderのソースコードを生成します。追加される内容は、VertexShader, FragmentShader両方の先頭に追加されます。
             * paramの内容は以下。
             *
             * position::bool
             * 'varying vec3 vPosition;'
             * を追加します。
             *
             * normal::bool
             * 'varying vec3 vNormal;'
             * を追加します。
             *
             * uv::bool
             * 'varying vec2 vUV;'
             * を追加します。
             */
            o.vsGen = def(param => {
                vsGenParams = param;
            });
            o.light = def(_ => {
                params.lights = true;
                params.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.lights, params.uniforms]);
            });
            o.fog = def(_ => {
                params.fog = true;
                params.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, params.uniforms]);
            });
            o.params = def(p => {
                Object.keys(p).forEach(k => {
                    params[k] = p[k];
                });
            });

            o.derivatives = def(_ => {
                params.extensions = {
                    derivatives : true
                };
            });

            /*
             * uniform::V->Shader
             * uniform変数を追加します。
             * vsGenを使用する場合、追加されたuniform変数はVertexShaderとFragmentShaderの先頭に宣言されます。
             */
            o.uniform = def(us => {
                Object.keys(us).forEach(k => {
                    const v = us[k];
                    params.uniforms[k] = {};
                    manageArgs(v => {
                        if (v.getTexture) {
                            params.uniforms[k].type = "t";
                            v.getTexture(texture => {
                                params.uniforms[k].value = texture;
                                add(kill => {
                                    if(!o.getMaterial()) return;
                                    kill();
                                    o.getMaterial().needsUpdate = true;
                                    texture.needsUpdate = true;
                                }, "shader texture update");
                            });
                        } else {
                            if (v instanceof Array) {
                                if (v[0] instanceof Array) {
                                    if (!params.uniforms[k].value)
                                        params.uniforms[k].value = [];
                                    for (let i = 0; i < v.length; i++) {
                                        switch (v[i].length) {
                                            case 2:
                                                if (!params.uniforms[k].value[i])
                                                    params.uniforms[k].value[i] = new THREE.Vector2();
                                                params.uniforms[k].value[i].set(v[i][0], v[i][1]);
                                                break;
                                            case 3:
                                                if (!params.uniforms[k].value[i])
                                                    params.uniforms[k].value[i] = new THREE.Vector3();
                                                params.uniforms[k].value[i].set(v[i][0], v[i][1], v[i][2]);
                                                break;
                                            case 4:
                                                if (!params.uniforms[k].value[i])
                                                    params.uniforms[k].value[i] = new THREE.Vector4();
                                                params.uniforms[k].value[i].set(v[i][0], v[i][1], v[i][2], v[i][3]);
                                                break;
                                        }
                                    }
                                } else {
                                    switch (v.length) {
                                        case 2:
                                            if (!params.uniforms[k].value)
                                                params.uniforms[k].value = new THREE.Vector2();
                                            params.uniforms[k].value.set(v[0], v[1]);
                                            break;
                                        case 3:
                                            if (!params.uniforms[k].value)
                                                params.uniforms[k].value = new THREE.Vector3();
                                            params.uniforms[k].value.set(v[0], v[1], v[2]);
                                            break;
                                        case 4:
                                            if (!params.uniforms[k].value)
                                                params.uniforms[k].value = new THREE.Vector4();
                                            params.uniforms[k].value.set(v[0], v[1], v[2], v[3]);
                                            break;
                                        default:
                                            if (!params.uniforms[k].value)
                                                params.uniforms[k].value = [];
                                            for (let i = 0; i < v.length; i++) {
                                                params.uniforms[k].value[i] = v[i];
                                            }
                                    }
                                }
                            } else {
                                params.uniforms[k].value = v;
                            }
                        }
                    }, "shader : key = " + k)(v);
                });
            });
            o.uniformsLib = def(unis => {
                params.uniforms = THREE.UniformsUtils.merge([params.uniforms, unis]);
            });
            const generateVertexShader = _ => {
                let vs = "";
                vs += generateVaryingDeclaration();
                vs += generateUniformDeclaration();
                //main関数の追加
                vs += "void main() {\n"
                    + "gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1);";
                if (vsGenParams.position) vs += "vPosition = (modelMatrix * vec4(position,1)).xyz;\n";
                if (vsGenParams.normal) vs += "vNormal = normal;\n";
                if (vsGenParams.uv) vs += "vUV = uv;\n";
                if (vsGenParams.viewPosition) vs += "vViewPosition = (modelViewMatrix * vec4(position, 1)).xyz;\n";
                if (vsGenParams.viewNormal) vs += "vViewNormal = (viewMatrix * vec4(normal, 0)).xyz;\n";
                vs += "}";
                return vs;
            };

            const generateVaryingDeclaration = _ => {
                let src = "";
                if (vsGenParams.position) src += "varying vec3 vPosition;\n";
                if (vsGenParams.normal) src += "varying vec3 vNormal;\n";
                if (vsGenParams.uv) src += "varying vec2 vUV;\n";
                if (vsGenParams.viewPosition) src += "varying vec3 vViewPosition;\n";
                if (vsGenParams.viewNormal) src += "varying vec3 vViewNormal;\n";
                return src;
            };
            const generateUniformDeclaration = _ => {
                let src = "";
                Object.keys(params.uniforms).forEach(k => {
                    const declare = (type, name) => "uniform " + type + " " + name + ";\n";
                    const uni = params.uniforms[k];
                    const v = uni.value;
                    if (v instanceof THREE.Vector2) {
                        src += declare("vec2", k);
                    } else if (v instanceof THREE.Vector3 || v instanceof THREE.Color) {
                        src += declare("vec3", k);
                    } else if (v instanceof THREE.Vector4) {
                        src += declare("vec4", k);
                    } else if (v instanceof THREE.Texture || uni.type === "t" || v instanceof THREE.WebGLRenderTarget) {
                        src += declare("sampler2D", k);
                    } else if (uni.properties) {
                        //some structures
                        const light = (type, TYPE, members, name) => {
                            let str = "#if NUM_" + TYPE + "_LIGHTS > 0\n\tstruct " + type + "{";
                            members.forEach(m => str += "\n\t" + m + ";");
                            str += "};\n\tuniform " + type + " " + name + "[NUM_" + TYPE + "_LIGHTS];\n#endif\n";
                            return str;
                        };
                        const prop = uni.properties;
                        if (prop.direction) {
                            if (prop.skyColor) {
                                src += light("HemisphereLight", "HEMI", ["vec3 direction", "vec3 skycolor", "vec3 groundColor"], k);
                            } else if (prop.position) {
                                src += light("SpotLight", "SPOT", ["vec3 position", "vec3 direction", "vec3 color", "float distance", "float decay", "float coneCos", "float penumbraCos", "int shadow", "float shadowBias", "float shadowRadius", "shadowMapSize"], k);
                            } else {
                                src += declare("float", k);
                            }
                        } else if(prop.position) {
                            src += light("PointLight", "POINT", ["vec3 position", "vec3 color", "float distance", "float decay", "int shadow", "float shadowBias", "float shadowRadius", "vec2 shadowMapSize"], k);
                        } else {
                            console.log("Couldn't interpret below object");
                            console.log(prop);
                            console.assert(false);
                        }
                    } else {
                        if (v instanceof Array) {
                            if (v[0] instanceof THREE.Vector2) {
                                src += `const int ${k}Num = ${v.length};\n`;
                                src += declare("vec2", `${k}[${v.length}]`);
                                return;
                            } else if (v[0] instanceof THREE.Vector3) {
                                src += `const int ${k}Num = ${v.length};\n`;
                                src += declare("vec3", `${k}[${v.length}]`);
                                return;
                            } else if (v[0] instanceof THREE.Vector4) {
                                src += `const int ${k}Num = ${v.length};\n`;
                                src += declare("vec4", `${k}[${v.length}]`);
                                return;
                            } else if (!(v[0] instanceof Object) && v.length > 0) {
                                src += `const int ${k}Num = ${v.length};\n`;
                                src += declare("float", `${k}[${v.length}]`);
                                return;
                            }
                        }
                        src += declare("float", k);
                    }
                });
                return src;
            };

            let material;
            o.getMaterial = _ => material;
            const create = cont => {
                if (vsGenParams) { //頂点シェーダ自動生成モード
                    getVS = cont => cont(generateVertexShader());
                }
                if (name && cache[name]) {
                    Object.keys(params).forEach(k => {
                        cache[name][k] = params[k];
                    });
                    cont(cache[name]);
                    return;
                }
                getVS(vertexShader => {
                    getFS(fragmentShader => {
                        //====================Vertex Shader Settings======================
                        params.vertexShader = vertexShader;

                        //=======================Fragment Shader Settings=====================
                        params.fragmentShader = "";
                        if (vsGenParams) { //頂点シェーダで自動的にvaryingが追加されていた場合
                            params.fragmentShader += generateVaryingDeclaration();
                        }
                        params.fragmentShader += generateUniformDeclaration();
                        params.fragmentShader += fragmentShader;

                        material = new THREE.ShaderMaterial(params);
                        if (name) cache[name] = material;
                        cont(material);
                    });
                });
            };
            return [o, create];
        };
    };
};
