/* ===== NeuroViz 3D Brain Renderer ===== */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

class BrainViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = Object.assign({
            backgroundColor: 0x0a0a18,
            cameraPosition: [0, 20, 320],
            enableControls: true,
            onRegionClick: null,
        }, options);

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.animId = null;

        this.brainGroup = new THREE.Group();
        this.leftHemiMesh = null;
        this.rightHemiMesh = null;
        this.subcorticalMeshes = [];
        this.tractLines = [];
        this.activationOverlay = null;
        this.regionMap = {};

        this.originalVertexColors = {};
        this.currentFocusedRegion = null;
        this.currentAtlas = 'hcp_mmp';
        this.focusRing = null;
        this.brainstemMesh = null;
        this.focusMeshes = {};
        this.contextMeshes = {};
        this.contextEdges = {};
        this.subCtxCortex = { meshes: {}, edges: {} };
        this.objLoader = new OBJLoader();
        this.loadPromise = null;

        this._minCameraDistance = 80;
        this._maxCameraDistance = 700;

        this.init();
    }

    init() {
        const { width, height } = this.container.getBoundingClientRect();
        if (width === 0 || height === 0) {
            setTimeout(() => this.init(), 100);
            return;
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);
////        this.scene.fog = new THREE.FogExp2(this.options.backgroundColor, 0.0001);

        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
        this.camera.position.set(...this.options.cameraPosition);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // 关闭ACES色调映射，避免高亮区域被压成灰白；用线性曝光让顶点颜色更真实
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        this.setupLights();

        if (this.options.enableControls) {
            // OrbitControls：左键旋转、滚轮缩放、右键平移，阻尼适中更跟手
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.08;
            this.controls.rotateSpeed = 0.65;
            this.controls.zoomSpeed = 1.0;
            this.controls.panSpeed = 0.8;
            this.controls.minDistance = this._minCameraDistance;
            this.controls.maxDistance = this._maxCameraDistance;
            this.controls.target.set(0, 15, 15);
            this.controls.update();
        }

        this.scene.add(this.brainGroup);
        this.addParticles();

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this._lastClientX = -1;
        this._lastClientY = -1;
        this._hoverRegionId = null;
        this._lastRaycastTime = 0;
        this._tooltip = this._createTooltip();

        // 拖拽 vs 点击判别：记录 pointerdown 位置，移动超过阈值算拖拽
        this._dragStartX = -1;
        this._dragStartY = -1;
        this._dragMoved = false;
        this._DRAG_THRESHOLD = 4; // 像素，移动超过此行视为拖拽

        const canvas = this.renderer.domElement;
        canvas.addEventListener('pointerdown', (e) => {
            this._dragStartX = e.clientX;
            this._dragStartY = e.clientY;
            this._dragMoved = false;
        }, true);
        document.addEventListener('pointerup', () => {
            this._dragStartX = -1;
            this._dragStartY = -1;
        }, true);

        canvas.addEventListener('pointermove', (e) => this.onMouseMove(e));
        canvas.addEventListener('pointerleave', () => {
            this._hoverRegionId = null;
            this._hideTooltip();
        });

        canvas.addEventListener('click', (e) => this.onClick(e));
        window.addEventListener('resize', () => this.onResize());

        this.animate();
    }

    setupLights() {
        // 环境光用纯白低强度，避免给顶点颜色染色
        const ambient = new THREE.AmbientLight(0xffffff, 0.42);
        this.scene.add(ambient);

        this._keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
        this._keyLight.castShadow = true;
        this._keyLight.shadow.mapSize.width = 2048;
        this._keyLight.shadow.mapSize.height = 2048;
        this._keyLight.shadow.camera.near = 1;
        this._keyLight.shadow.camera.far = 1200;
        this._keyLight.shadow.camera.left = -350;
        this._keyLight.shadow.camera.right = 350;
        this._keyLight.shadow.camera.top = 350;
        this._keyLight.shadow.camera.bottom = -350;
        this._keyLight.shadow.bias = -0.0001;
        this.scene.add(this._keyLight);

        // 补光也用接近白色但低强度，只给阴影处一点细节
        this._fillLight = new THREE.DirectionalLight(0xcce0ff, 0.28);
        this.scene.add(this._fillLight);

        // 轮廓光微微增强边缘立体感，不抢颜色
        this._rimLight = new THREE.DirectionalLight(0x88ccff, 0.25);
        this.scene.add(this._rimLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0a0a18, 0.32);
        this.scene.add(hemiLight);
    }

    _updateLightsToCamera() {
        const camPos = this.camera.position;
        const target = this.controls ? this.controls.target : new THREE.Vector3(0, 0, 0);

        // 前向方向：从 target 指向相机
        const forward = new THREE.Vector3().subVectors(camPos, target).normalize();
        // 右侧方向
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        if (this._keyLight) {
            // 主光放在相机右上前方
            const keyDir = forward.clone().add(right.clone().multiplyScalar(0.25)).add(new THREE.Vector3(0, 0.1, 0)).normalize();
            this._keyLight.position.copy(camPos.clone().add(keyDir.multiplyScalar(250)));
            this._keyLight.target.position.copy(target);
            this._keyLight.target.updateMatrixWorld();
        }

        if (this._fillLight) {
            // 补光放在相机左下方
            const fillDir = forward.clone().add(right.clone().multiplyScalar(-0.5)).add(new THREE.Vector3(0, -0.3, 0)).normalize();
            this._fillLight.position.copy(camPos.clone().add(fillDir.multiplyScalar(200)));
        }

        if (this._rimLight) {
            // 轮廓光放在相机后方偏下
            const rimDir = forward.clone().multiplyScalar(-0.5).add(new THREE.Vector3(0, -0.4, 0)).normalize();
            this._rimLight.position.copy(camPos.clone().add(rimDir.multiplyScalar(180)));
        }
    }

    addParticles() {
        const particleGeo = new THREE.BufferGeometry();
        const particleCount = 400;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 500;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 500;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x334466,
            size: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.4,
        });
        this.scene.add(new THREE.Points(particleGeo, particleMat));
    }

    loadOBJ(url, hemisphere) {
        // 完全手动解析 OBJ 文本，确保顶点颜色正确映射
        // OBJLoader 不解析 v x y z r g b 中的色彩分量，且会重排顶点顺序
        return fetch(url).then(r => r.text()).then(objText => {
            const rawPositions = [];  // [x0,y0,z0, x1,y1,z1, ...]
            const rawColors = [];     // [r0,g0,b0, r1,g1,b1, ...]

            // 构建参考色板（从当前图谱数据）
            const refPalette = [];
            const atlasRegions = (typeof ATLAS_REGIONS !== 'undefined' ? ATLAS_REGIONS[this.currentAtlas] : null) || [];
            for (const region of atlasRegions) {
                const hex = region.color;
                const h = hex.replace('#', '');
                refPalette.push({
                    r: parseInt(h.substring(0, 2), 16) / 255,
                    g: parseInt(h.substring(2, 4), 16) / 255,
                    b: parseInt(h.substring(4, 6), 16) / 255,
                    hex: '#' + h,
                    id: region.id
                });
            }

            // 解析所有行
            const lines = objText.split('\n');
            const parsedFaces = [];   // 每个面的三元组 [[vi1,ni1], [vi2,ni2], [vi3,ni3]]

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('v ') && !trimmed.startsWith('vn ') && !trimmed.startsWith('vt ')) {
                    // 顶点行: v x y z r g b
                    const parts = trimmed.split(/\s+/);
                    if (parts.length >= 7) {
                        rawPositions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                        rawColors.push(parseFloat(parts[4]), parseFloat(parts[5]), parseFloat(parts[6]));
                    }
                } else if (trimmed.startsWith('f ')) {
                    // 面行: f v1//n1 v2//n2 v3//n3
                    const parts = trimmed.split(/\s+/);
                    const faceVerts = [];
                    for (let i = 1; i < parts.length; i++) {
                        const segs = parts[i].split('//');
                        faceVerts.push({
                            vi: parseInt(segs[0]) - 1,  // 转为 0 基索引
                            ni: segs.length > 1 ? parseInt(segs[1]) - 1 : -1
                        });
                    }
                    parsedFaces.push(faceVerts);
                }
            }

            if (rawPositions.length === 0) {
                throw new Error('No vertices found in ' + url);
            }

            console.log('[NeuroViz] Parsed', rawPositions.length / 3, 'original vertices,',
                parsedFaces.length, 'faces for', hemisphere);

            // 量化前先分析原始 OBJ 中有哪些颜色接近我们的参考色板
            if (refPalette.length > 0 && hemisphere === 'left') {
                // 仅在左半球做一次分析，避免重复
                const origRegionCounts = {};
                for (const ref of refPalette) { origRegionCounts[ref.hex] = 0; }
                const colorMatchThreshold = 0.06; // 稍宽松阈值做诊断
                for (let i = 0; i < rawColors.length; i += 3) {
                    const vr = rawColors[i], vg = rawColors[i + 1], vb = rawColors[i + 2];
                    // 跳过接近黑色的顶点（可能不属于任何区域）
                    if (vr + vg + vb < 0.1) continue;
                    for (const ref of refPalette) {
                        const dr = vr - ref.r, dg = vg - ref.g, db = vb - ref.b;
                        if (dr * dr + dg * dg + db * db < colorMatchThreshold * colorMatchThreshold) {
                            origRegionCounts[ref.hex] = (origRegionCounts[ref.hex] || 0) + 1;
                            break;
                        }
                    }
                }
                const origMissing = Object.entries(origRegionCounts).filter(([, c]) => c === 0).map(([h]) => h);
                if (origMissing.length > 0) {
                    console.warn('[NeuroViz] Pre-quantization: OBJ model has NO vertices matching these ' + origMissing.length + ' colors:');
                    origMissing.forEach(hex => console.warn('  -', hex));
                    console.warn('[NeuroViz] These regions will NOT highlight correctly when clicked in the legend.');
                } else {
                    console.log('[NeuroViz] Pre-quantization: All ' + Object.keys(origRegionCounts).length + ' reference colors found in OBJ model');
                }
            }

            // 颜色量化：将每个顶点颜色映射到最接近的图例色板颜色
            if (refPalette.length > 0) {
                let quantizedCount = 0;
                for (let i = 0; i < rawColors.length; i += 3) {
                    const vr = rawColors[i], vg = rawColors[i + 1], vb = rawColors[i + 2];
                    let minDist = Infinity, best = refPalette[0];
                    for (const ref of refPalette) {
                        const dr = vr - ref.r, dg = vg - ref.g, db = vb - ref.b;
                        const dist = dr * dr + dg * dg + db * db;
                        if (dist < minDist) { minDist = dist; best = ref; }
                    }
                    if (rawColors[i] !== best.r || rawColors[i + 1] !== best.g || rawColors[i + 2] !== best.b) {
                        quantizedCount++;
                    }
                    rawColors[i] = best.r;
                    rawColors[i + 1] = best.g;
                    rawColors[i + 2] = best.b;
                }
                console.log('[NeuroViz] Color quantized', quantizedCount, 'of', rawColors.length / 3,
                    'vertices to reference palette for', hemisphere);
            }

            // 构建索引几何体：以原始顶点位置索引为 key，
            // 每个唯一的位置索引对应几何体中的一个条目，保证颜色正确
            const geoVertexMap = {}; // positionIndex -> geometryIndex
            const geoPositions = [];
            const geoColors = [];
            const geoIndices = [];

            let nextGeoIndex = 0;
            const getGeoIndex = (posIdx) => {
                if (geoVertexMap[posIdx] === undefined) {
                    geoVertexMap[posIdx] = nextGeoIndex++;
                    // 复制位置
                    const p = posIdx * 3;
                    geoPositions.push(rawPositions[p], rawPositions[p + 1], rawPositions[p + 2]);
                    // 复制颜色
                    geoColors.push(rawColors[p], rawColors[p + 1], rawColors[p + 2]);
                }
                return geoVertexMap[posIdx];
            };

            // 处理所有的面
            for (const face of parsedFaces) {
                for (let i = 1; i < face.length - 1; i++) {
                    geoIndices.push(
                        getGeoIndex(face[0].vi),
                        getGeoIndex(face[i].vi),
                        getGeoIndex(face[i + 1].vi)
                    );
                }
            }

            console.log('[NeuroViz] Built geometry:', nextGeoIndex, 'unique vertices,',
                geoIndices.length / 3, 'triangles for', hemisphere);
            console.log('[NeuroViz] First 3 colors:', geoColors[0], geoColors[1], geoColors[2],
                '|', geoColors[3], geoColors[4], geoColors[5],
                '|', geoColors[6], geoColors[7], geoColors[8]);

            // 创建 BufferGeometry
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position',
                new THREE.BufferAttribute(new Float32Array(geoPositions), 3));
            geometry.setAttribute('color',
                new THREE.BufferAttribute(new Float32Array(geoColors), 3));
            geometry.setIndex(geoIndices);
            geometry.computeVertexNormals();

            // 保存原始颜色
            this.originalVertexColors[hemisphere] = new Float32Array(geoColors);

            // MeshStandardMaterial  matte 表面，最大限度保留顶点颜色
            const material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                color: 0xffffff,
                roughness: 0.78,
                metalness: 0.0,
                flatShading: false,
                side: THREE.FrontSide,
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { type: 'cortex', hemisphere };

            return mesh;
        });
    }

    createFullBrain(atlasId, selectedHemi = 'both') {
        this.currentAtlas = atlasId || this.currentAtlas || 'hcp_mmp';

        while (this.brainGroup.children.length > 0) {
            const child = this.brainGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
            this.brainGroup.remove(child);
        }
        this.subcorticalMeshes = [];
        this.regionMap = {};
        this.originalVertexColors = {};
        this.currentFocusedRegion = null;
        this.leftHemiMesh = null;
        this.rightHemiMesh = null;

        const hemispheres = selectedHemi === 'both' ? ['left', 'right'] : [selectedHemi];
        const loadTasks = [];

        const objVersion = 'v=5';
        if (hemispheres.includes('left')) {
            loadTasks.push(
                this.loadOBJ(`models/brain_lh_${this.currentAtlas}.obj?${objVersion}`, 'left').then(mesh => {
                    this.leftHemiMesh = mesh;
                    this.brainGroup.add(mesh);
                })
            );
        }
        if (hemispheres.includes('right')) {
            loadTasks.push(
                this.loadOBJ(`models/brain_rh_${this.currentAtlas}.obj?${objVersion}`, 'right').then(mesh => {
                    this.rightHemiMesh = mesh;
                    this.brainGroup.add(mesh);
                })
            );
        }

        this.loadPromise = Promise.all(loadTasks).then(() => {
            this.brainGroup.position.set(0, -10, 0);
            // 诊断：分析模型中实际存在的区域
            this.analyzeRegionDistribution();
            // 根据模型包围盒计算旋转中心
            this.fitCameraToBrain();
            // 同步OrbitControls的距离限制
            if (this.controls) {
                this.controls.minDistance = this._minCameraDistance;
                this.controls.maxDistance = this._maxCameraDistance;
                this.controls.update();
            }
            return this.brainGroup;
        });

        return this.loadPromise;
    }

    analyzeRegionDistribution() {
        const atlasRegions = (typeof ATLAS_REGIONS !== 'undefined' ? ATLAS_REGIONS[this.currentAtlas] : []) || [];
        const colorToRegion = {};
        for (const region of atlasRegions) {
            colorToRegion[region.color] = region.id;
        }

        const regionCounts = {};
        for (const region of atlasRegions) {
            regionCounts[region.id] = 0;
        }

        const colorMatchThreshold = 0.002;
        ['left', 'right'].forEach(hemi => {
            const mesh = hemi === 'left' ? this.leftHemiMesh : this.rightHemiMesh;
            if (!mesh || !mesh.geometry) return;
            const origColors = this.originalVertexColors[hemi];
            if (!origColors) return;

            const count = origColors.length / 3;
            for (let i = 0; i < count; i++) {
                const idx3 = i * 3;
                const vr = origColors[idx3], vg = origColors[idx3 + 1], vb = origColors[idx3 + 2];
                for (const [hex, regionId] of Object.entries(colorToRegion)) {
                    const h = hex.replace('#', '');
                    const tr = parseInt(h.substring(0, 2), 16) / 255;
                    const tg = parseInt(h.substring(2, 4), 16) / 255;
                    const tb = parseInt(h.substring(4, 6), 16) / 255;
                    if (Math.abs(vr - tr) < colorMatchThreshold &&
                        Math.abs(vg - tg) < colorMatchThreshold &&
                        Math.abs(vb - tb) < colorMatchThreshold) {
                        regionCounts[regionId] = (regionCounts[regionId] || 0) + 1;
                        break;
                    }
                }
            }
        });

        const present = [];
        const missing = [];
        for (const [regionId, count] of Object.entries(regionCounts)) {
            if (count > 0) {
                present.push({ id: regionId, count });
            } else {
                missing.push(regionId);
            }
        }

        console.log('[NeuroViz] === Region Distribution Analysis ===');
        console.log('[NeuroViz] Present regions (' + present.length + '/' + Object.keys(regionCounts).length + '):',
            present.sort((a, b) => b.count - a.count).map(r => r.id + ':' + r.count).join(', '));
        if (missing.length > 0) {
            console.warn('[NeuroViz] MISSING regions (' + missing.length + '):', missing.join(', '));
            console.warn('[NeuroViz] These regions have NO vertices in the OBJ model!');
        }
        console.log('[NeuroViz] Total reference regions:', Object.keys(regionCounts).length);

        this._regionAnalysis = { present, missing, regionCounts };
        return this._regionAnalysis;
    }

    focusCorticalRegion(targetColorHex) {
        if (!targetColorHex) {
            console.warn('[NeuroViz] focusCorticalRegion called without color');
            return;
        }

        const hex = targetColorHex.replace('#', '');
        const tr = parseInt(hex.substring(0, 2), 16) / 255;
        const tg = parseInt(hex.substring(2, 4), 16) / 255;
        const tb = parseInt(hex.substring(4, 6), 16) / 255;
        const colorMatchThreshold = 0.002;

        console.log('[NeuroViz] focusCorticalRegion:', targetColorHex,
            'parsed:', tr.toFixed(4), tg.toFixed(4), tb.toFixed(4),
            'threshold:', colorMatchThreshold);

        // 清除旧聚焦，避免重复添加 focus/context mesh
        this.clearCorticalFocus();

        let totalMatched = 0;

        ['left', 'right'].forEach(hemi => {
            const mesh = hemi === 'left' ? this.leftHemiMesh : this.rightHemiMesh;
            if (!mesh || !mesh.geometry) {
                console.warn('[NeuroViz] focusCorticalRegion: no mesh for', hemi);
                return;
            }

            const geometry = mesh.geometry;
            const indexAttr = geometry.index;
            const colorAttr = geometry.attributes.color;
            const origColors = this.originalVertexColors[hemi];
            const colorArray = origColors || colorAttr.array;

            if (!indexAttr || !colorAttr || !colorArray) {
                console.warn('[NeuroViz] focusCorticalRegion: missing attributes for', hemi);
                return;
            }

            const indices = indexAttr.array;
            const vertexCount = colorAttr.count;
            const vertexMatch = new Uint8Array(vertexCount);

            // 标记目标颜色顶点
            for (let i = 0; i < vertexCount; i++) {
                const idx3 = i * 3;
                const vr = colorArray[idx3];
                const vg = colorArray[idx3 + 1];
                const vb = colorArray[idx3 + 2];
                const match = Math.abs(vr - tr) < colorMatchThreshold &&
                    Math.abs(vg - tg) < colorMatchThreshold &&
                    Math.abs(vb - tb) < colorMatchThreshold;
                vertexMatch[i] = match ? 1 : 0;
                if (match) totalMatched++;
            }

            // 按面分离：整个面都是目标颜色才算目标区域
            const focusIndices = [];
            const contextIndices = [];
            for (let i = 0; i < indices.length; i += 3) {
                const a = indices[i];
                const b = indices[i + 1];
                const c = indices[i + 2];
                if (vertexMatch[a] && vertexMatch[b] && vertexMatch[c]) {
                    focusIndices.push(a, b, c);
                } else {
                    contextIndices.push(a, b, c);
                }
            }

            // 隐藏原 mesh，避免与 focus/context mesh 重叠
            mesh.visible = false;

            if (focusIndices.length === 0) {
                // 对面半球：没有匹配目标脑区，全部渲染为半透明背景
                console.log('[NeuroViz] focusCorticalRegion:', hemi, 'hemisphere has NO matching vertices, creating full-context overlay');
                this._createFullContextMesh(hemi, geometry, vertexCount);
                return;
            }

            // ---- 目标区域 mesh：不透明、鲜艳 ----
            const focusGeo = geometry.clone();
            focusGeo.setIndex(focusIndices);
            const focusColors = new Float32Array(vertexCount * 3);
            for (let i = 0; i < vertexCount; i++) {
                focusColors[i * 3] = colorArray[i * 3];
                focusColors[i * 3 + 1] = colorArray[i * 3 + 1];
                focusColors[i * 3 + 2] = colorArray[i * 3 + 2];
            }
            focusGeo.setAttribute('color', new THREE.BufferAttribute(focusColors, 3));

            const focusMat = new THREE.MeshStandardMaterial({
                vertexColors: true,
                color: 0xffffff,
                roughness: 0.7,
                metalness: 0.05,
                transparent: false,
                opacity: 1.0,
                depthWrite: true,
                emissive: new THREE.Color(targetColorHex),
                emissiveIntensity: 0.12,
                side: THREE.FrontSide,
            });

            const focusMesh = new THREE.Mesh(focusGeo, focusMat);
            focusMesh.castShadow = true;
            focusMesh.receiveShadow = true;
            focusMesh.userData = { type: 'cortex-focus', hemisphere: hemi };
            this.brainGroup.add(focusMesh);
            this.focusMeshes[hemi] = focusMesh;

            // ---- 非目标区域 mesh：半透明暗色 ----
            if (contextIndices.length > 0) {
                this._createContextMesh(hemi, geometry, vertexCount, contextIndices);
            }

            console.log('[NeuroViz] focusCorticalRegion:', hemi,
                'focus faces:', focusIndices.length / 3,
                'context faces:', contextIndices.length / 3);
        });

        // 聚焦皮层时，把皮层下彩色小球也隐藏/淡化，避免喧宾夺主
        this.subcorticalMeshes.forEach(m => {
            m.material.transparent = true;
            m.material.opacity = 0.08;
            m.material.depthWrite = false;
            m.material.emissiveIntensity = 0;
            m.material.needsUpdate = true;
        });

        console.log('[NeuroViz] focusCorticalRegion: total matched vertices:', totalMatched);
        this.currentFocusedRegion = targetColorHex;
    }

    clearCorticalFocus() {
        ['left', 'right'].forEach(hemi => {
            const mesh = hemi === 'left' ? this.leftHemiMesh : this.rightHemiMesh;
            if (mesh) {
                // 恢复原始皮层 mesh 可见性
                mesh.visible = true;
                // 恢复材质为完全不透明
                mesh.material.transparent = false;
                mesh.material.opacity = 1.0;
                mesh.material.depthWrite = true;
                mesh.material.emissive = new THREE.Color(0x000000);
                mesh.material.emissiveIntensity = 0;
                mesh.material.roughness = 0.9;
                mesh.material.needsUpdate = true;
            }

            // 移除 focus/context mesh 及轮廓线
            if (this.focusMeshes[hemi]) {
                this.brainGroup.remove(this.focusMeshes[hemi]);
                this.focusMeshes[hemi].geometry.dispose();
                this.focusMeshes[hemi].material.dispose();
                this.focusMeshes[hemi] = null;
            }
            if (this.contextMeshes[hemi]) {
                this.brainGroup.remove(this.contextMeshes[hemi]);
                this.contextMeshes[hemi].geometry.dispose();
                this.contextMeshes[hemi].material.dispose();
                this.contextMeshes[hemi] = null;
            }
            if (this.contextEdges[hemi]) {
                this.brainGroup.remove(this.contextEdges[hemi]);
                this.contextEdges[hemi].geometry.dispose();
                this.contextEdges[hemi].material.dispose();
                this.contextEdges[hemi] = null;
            }
        });

        // 恢复皮层下结构显示
        this.subcorticalMeshes.forEach(m => {
            m.material.transparent = false;
            m.material.opacity = 1.0;
            m.material.depthWrite = true;
            m.material.emissive = new THREE.Color(m.userData.color || m.material.color).multiplyScalar(0.15);
            m.material.emissiveIntensity = 0.05;
            m.material.needsUpdate = true;
        });

        this.currentFocusedRegion = null;
    }

    _createContextMesh(hemi, geometry, vertexCount, contextIndices) {
        const contextGeo = geometry.clone();
        contextGeo.setIndex(contextIndices);
        const contextColors = new Float32Array(vertexCount * 3);
        for (let i = 0; i < vertexCount; i++) {
            contextColors[i * 3] = 0.55;
            contextColors[i * 3 + 1] = 0.55;
            contextColors[i * 3 + 2] = 0.6;
        }
        contextGeo.setAttribute('color', new THREE.BufferAttribute(contextColors, 3));

        const contextMat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0.0,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            side: THREE.FrontSide,
        });

        const contextMesh = new THREE.Mesh(contextGeo, contextMat);
        contextMesh.receiveShadow = true;
        contextMesh.userData = { type: 'cortex-context', hemisphere: hemi };
        this.brainGroup.add(contextMesh);
        this.contextMeshes[hemi] = contextMesh;

        // 淡白色轮廓线
        const edgesGeo = new THREE.EdgesGeometry(contextGeo, 85);
        const edgesMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
        });
        const edges = new THREE.LineSegments(edgesGeo, edgesMat);
        edges.userData = { type: 'cortex-context-edges', hemisphere: hemi };
        this.brainGroup.add(edges);
        this.contextEdges[hemi] = edges;
    }

    _createFullContextMesh(hemi, geometry, vertexCount) {
        // 对面半球全部渲染为半透明背景（没有 focus 部分）
        const allIndices = [];
        const indexAttr = geometry.index;
        if (!indexAttr) return;
        const indices = indexAttr.array;
        for (let i = 0; i < indices.length; i++) {
            allIndices.push(indices[i]);
        }
        this._createContextMesh(hemi, geometry, vertexCount, allIndices);
    }

    animateCameraTo(targetPos, targetLookAt, duration = 800) {
        // 动画期间关闭阻尼，防止手动设置的 target/position 被 controls.update() 的惯性覆盖
        const prevStaticMoving = this.controls.staticMoving;
        this.controls.staticMoving = true;

        const startPos = this.camera.position.clone();
        const startTarget = this.controls.target.clone();
        const endPos = new THREE.Vector3(...targetPos);
        const endTarget = new THREE.Vector3(...targetLookAt);
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            this.camera.position.lerpVectors(startPos, endPos, ease);
            this.controls.target.lerpVectors(startTarget, endTarget, ease);
            this.controls.update();

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                // 动画完成，恢复阻尼
                this.controls.staticMoving = prevStaticMoving;
            }
        };
        requestAnimationFrame(animate);
    }

    getRegionSpatialCenter(regionColorHex, hemisphere = 'both') {
        const info = this.getRegionSpatialInfo(regionColorHex, hemisphere);
        return info ? { x: info.x, y: info.y, z: info.z } : null;
    }

    getRegionSpatialInfo(regionColorHex, hemisphere = 'both') {
        if (!regionColorHex) return null;

        const hex = regionColorHex.replace('#', '');
        const tr = parseInt(hex.substring(0, 2), 16) / 255;
        const tg = parseInt(hex.substring(2, 4), 16) / 255;
        const tb = parseInt(hex.substring(4, 6), 16) / 255;
        const colorMatchThreshold = 0.002;

        let sumX = 0, sumY = 0, sumZ = 0, count = 0;
        let sumNx = 0, sumNy = 0, sumNz = 0;

        const hemis = hemisphere === 'both' ? ['left', 'right'] : [hemisphere];
        hemis.forEach(hemi => {
            const mesh = hemi === 'left' ? this.leftHemiMesh : this.rightHemiMesh;
            if (!mesh || !mesh.geometry) return;
            const colorAttr = mesh.geometry.attributes.color;
            const posAttr = mesh.geometry.attributes.position;
            const normalAttr = mesh.geometry.attributes.normal;
            if (!colorAttr || !posAttr) return;

            const refColors = this.originalVertexColors[hemi];
            const colorArray = refColors || colorAttr.array;
            if (!colorArray) return;

            for (let i = 0; i < colorAttr.count; i++) {
                const idx3 = i * 3;
                if (Math.abs(colorArray[idx3] - tr) < colorMatchThreshold &&
                    Math.abs(colorArray[idx3 + 1] - tg) < colorMatchThreshold &&
                    Math.abs(colorArray[idx3 + 2] - tb) < colorMatchThreshold) {
                    sumX += posAttr.getX(i);
                    sumY += posAttr.getY(i);
                    sumZ += posAttr.getZ(i);
                    // 累加顶点法线（用于计算区域朝向）
                    if (normalAttr) {
                        sumNx += normalAttr.getX(i);
                        sumNy += normalAttr.getY(i);
                        sumNz += normalAttr.getZ(i);
                    }
                    count++;
                }
            }
        });

        if (count === 0) {
            console.warn('[NeuroViz] getRegionSpatialInfo: no matching vertices for', regionColorHex);
            return null;
        }

        // 归一化平均法线
        const nx = sumNx, ny = sumNy, nz = sumNz;
        const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const normalX = nLen > 0.001 ? nx / nLen : 0;
        const normalY = nLen > 0.001 ? ny / nLen : 0;
        const normalZ = nLen > 0.001 ? nz / nLen : 1;

        console.log('[NeuroViz] getRegionSpatialInfo: found', count, 'vertices for', regionColorHex,
            'normal:', normalX.toFixed(3), normalY.toFixed(3), normalZ.toFixed(3));

        return {
            x: sumX / count,
            y: sumY / count,
            z: sumZ / count,
            nx: normalX,
            ny: normalY,
            nz: normalZ
        };
    }

    // ---------- 皮下层解剖形状生成器 ----------

    _createProceduralBumpTexture(size = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 1400; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 1 + Math.random() * 3.5;
            const v = Math.floor(90 + Math.random() * 75);
            const a = 0.12 + Math.random() * 0.28;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${v},${v},${v},${a})`;
            ctx.fill();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        return tex;
    }

    _addTubeDetail(geometry, curve, baseRadius, radiusProfile, crossScaleProfile) {
        // 为 TubeGeometry 添加：变半径、截面缩放、细微表面起伏
        const positions = geometry.attributes.position.array;
        const samples = 160;
        const curvePoints = [];
        for (let i = 0; i <= samples; i++) {
            curvePoints.push(curve.getPointAt(i / samples));
        }
        const tmp = new THREE.Vector3();
        const center = new THREE.Vector3();
        const radial = new THREE.Vector3();
        for (let i = 0; i < positions.length; i += 3) {
            tmp.set(positions[i], positions[i + 1], positions[i + 2]);
            let bestIdx = 0;
            let bestD = Infinity;
            for (let k = 0; k < curvePoints.length; k++) {
                const d = tmp.distanceToSquared(curvePoints[k]);
                if (d < bestD) {
                    bestD = d;
                    bestIdx = k;
                }
            }
            const t = bestIdx / samples;
            center.copy(curvePoints[bestIdx]);
            radial.subVectors(tmp, center);
            const currentR = radial.length();
            if (currentR < 0.0001) continue;
            radial.normalize();

            const r = baseRadius * (radiusProfile ? radiusProfile(t) : 1);
            const scale = crossScaleProfile ? crossScaleProfile(t) : { x: 1, y: 1, z: 1 };
            // 细微表面起伏，打破平滑塑料感
            const noise = 0.04 * Math.sin(12 * t + radial.x * 3) * Math.cos(9 * t + radial.z * 2);
            const factor = r * (1 + noise);
            radial.x *= scale.x * factor;
            radial.y *= scale.y * factor;
            radial.z *= scale.z * factor;
            tmp.copy(center).add(radial);
            positions[i] = tmp.x;
            positions[i + 1] = tmp.y;
            positions[i + 2] = tmp.z;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        return geometry;
    }

    _addOrganicNoise(geometry, amplitude) {
        const positions = geometry.attributes.position.array;
        const tmp = new THREE.Vector3();
        const normal = new THREE.Vector3();
        for (let i = 0; i < positions.length; i += 3) {
            tmp.set(positions[i], positions[i + 1], positions[i + 2]);
            normal.copy(tmp).normalize();
            const n =
                Math.sin(8 * normal.x + 2 * normal.y) *
                Math.cos(7 * normal.y - 3 * normal.z) *
                Math.sin(6 * normal.z + normal.x);
            tmp.add(normal.multiplyScalar(amplitude * n));
            positions[i] = tmp.x;
            positions[i + 1] = tmp.y;
            positions[i + 2] = tmp.z;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
    }

    _createAmygdalaGeometry(size) {
        // 杏仁核：近似杏仁/水滴，前端尖、后端圆、侧面向内压扁
        const geo = new THREE.IcosahedronGeometry(size, 3);
        const pos = geo.attributes.position.array;
        const tmp = new THREE.Vector3();
        for (let i = 0; i < pos.length; i += 3) {
            tmp.set(pos[i], pos[i + 1], pos[i + 2]);
            const n = tmp.clone().normalize();
            let r = size;
            // 前端（+x）收尖
            r *= 1.0 - 0.38 * Math.max(0, n.x);
            // 背腹略扁，内外侧更扁
            r *= 1.0 - 0.22 * Math.abs(n.z);
            r *= 1.0 - 0.12 * Math.abs(n.y);
            // 表面小起伏
            r += size * 0.03 * Math.sin(10 * n.x) * Math.cos(8 * n.z);
            tmp.copy(n).multiplyScalar(r);
            pos[i] = tmp.x;
            pos[i + 1] = tmp.y;
            pos[i + 2] = tmp.z;
        }
        geo.computeVertexNormals();
        this._addOrganicNoise(geo, size * 0.025);
        return geo;
    }

    _createThalamusGeometry(size) {
        // 丘脑：卵圆形，底部略平，前后稍长
        const geo = new THREE.IcosahedronGeometry(size, 3);
        const pos = geo.attributes.position.array;
        const tmp = new THREE.Vector3();
        for (let i = 0; i < pos.length; i += 3) {
            tmp.set(pos[i], pos[i + 1], pos[i + 2]);
            const n = tmp.clone().normalize();
            let r = size;
            r *= 1.0 + 0.18 * Math.abs(n.x);      // 前后稍长
            r *= 1.0 - 0.15 * Math.abs(n.z);      // 内外侧稍扁
            if (n.y < 0) r *= 1.0 + 0.22 * n.y;   // 底面略平
            r += size * 0.02 * Math.sin(7 * n.x) * Math.cos(6 * n.y + 2 * n.z);
            tmp.copy(n).multiplyScalar(r);
            pos[i] = tmp.x;
            pos[i + 1] = tmp.y;
            pos[i + 2] = tmp.z;
        }
        geo.computeVertexNormals();
        this._addOrganicNoise(geo, size * 0.02);
        return geo;
    }

    _createLensGeometry(size, flattenY, concaveMedial) {
        // 壳核/苍白球：透镜状，背腹显著压扁，内侧略凹
        const geo = new THREE.IcosahedronGeometry(size, 3);
        const pos = geo.attributes.position.array;
        const tmp = new THREE.Vector3();
        for (let i = 0; i < pos.length; i += 3) {
            tmp.set(pos[i], pos[i + 1], pos[i + 2]);
            const n = tmp.clone().normalize();
            let r = size;
            r *= 1.0 - (1.0 - flattenY) * Math.abs(n.y);
            r *= 1.0 + 0.12 * Math.abs(n.x);
            if (concaveMedial && n.z > 0) r *= 1.0 - 0.22 * n.z;
            tmp.copy(n).multiplyScalar(r);
            pos[i] = tmp.x;
            pos[i + 1] = tmp.y;
            pos[i + 2] = tmp.z;
        }
        geo.computeVertexNormals();
        this._addOrganicNoise(geo, size * 0.02);
        return geo;
    }

    _createCerebellarHemisphereGeometry(size) {
        // 小脑半球：整体压扁，表面模拟小脑叶片（lobules）的起伏
        const geo = new THREE.IcosahedronGeometry(size, 3);
        const pos = geo.attributes.position.array;
        const tmp = new THREE.Vector3();
        for (let i = 0; i < pos.length; i += 3) {
            tmp.set(pos[i], pos[i + 1], pos[i + 2]);
            const n = tmp.clone().normalize();
            let r = size;
            r *= 1.0 - 0.45 * Math.abs(n.y); // 上下压扁
            r *= 1.0 + 0.25 * Math.abs(n.x); // 横向延展
            // 多尺度分叶起伏
            const lobes = 4.5 * n.x + 3.2 * n.z + 1.8 * n.y;
            r += size * 0.14 * Math.sin(lobes) * Math.sin(lobes * 1.9);
            r += size * 0.07 * Math.sin(9 * n.x) * Math.cos(7 * n.z);
            r = Math.max(size * 0.25, r);
            tmp.copy(n).multiplyScalar(r);
            pos[i] = tmp.x;
            pos[i + 1] = tmp.y;
            pos[i + 2] = tmp.z;
        }
        geo.computeVertexNormals();
        return geo;
    }

    _createVermisGeometry(size) {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -size * 1.25, size * 0.35),
            new THREE.Vector3(0, -size * 0.35, -size * 0.45),
            new THREE.Vector3(0, size * 0.55, -size * 0.25),
            new THREE.Vector3(0, size * 1.35, size * 0.35),
        ]);
        const geo = new THREE.TubeGeometry(curve, 30, size * 0.42, 14, false);
        return this._addTubeDetail(geo, curve, size * 0.42,
            t => 1.0 - 0.4 * Math.abs(t - 0.5),
            () => ({ x: 0.5, y: 1.0, z: 0.9 })
        );
    }

    _createCCGeometry(size) {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-size * 1.1, -size * 0.55, 0),
            new THREE.Vector3(-size * 0.35, size * 0.9, 0),
            new THREE.Vector3(size * 0.35, size * 0.9, 0),
            new THREE.Vector3(size * 1.1, -size * 0.55, 0),
        ]);
        const geo = new THREE.TubeGeometry(curve, 32, size * 0.32, 14, false);
        return this._addTubeDetail(geo, curve, size * 0.32,
            t => 1.0 + 0.8 * Math.sin(Math.PI * t),
            () => ({ x: 0.28, y: 1.0, z: 1.0 })
        );
    }

    _createVentricleGeometry(size, id) {
        // 脑室：C 形薄壁腔隙
        if (id === 'lat_ventricle') {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(size * 0.8, size * 0.2, size * 0.5),
                new THREE.Vector3(size * 0.4, size * 0.8, -size * 0.2),
                new THREE.Vector3(-size * 0.2, size * 0.6, -size * 0.5),
                new THREE.Vector3(-size * 0.6, -size * 0.2, -size * 0.3),
            ]);
            const geo = new THREE.TubeGeometry(curve, 28, size * 0.35, 12, false);
            return this._addTubeDetail(geo, curve, size * 0.35,
                t => 1.0 - 0.25 * Math.abs(t - 0.5),
                () => ({ x: 1.0, y: 0.5, z: 0.85 })
            );
        }
        if (id === 'third_ventricle') {
            const geo = new THREE.IcosahedronGeometry(size, 3);
            geo.scale(0.5, 1.3, 0.35);
            this._addOrganicNoise(geo, size * 0.04);
            return geo;
        }
        // fourth_ventricle / fallback
        const geo = new THREE.IcosahedronGeometry(size, 3);
        geo.scale(0.9, 0.55, 0.7);
        this._addOrganicNoise(geo, size * 0.03);
        return geo;
    }

    _createSubcorticalGeometry(id, size) {
        if (id.startsWith('ca') || id === 'dg') {
            // 海马亚区：弯曲 S 形管，截面椭圆、尾端变细
            const pts = [
                new THREE.Vector3(0, -size * 1.2, 0),
                new THREE.Vector3(size * 0.5, -size * 0.15, size * 0.3),
                new THREE.Vector3(0, size * 0.4, size * 0.45),
                new THREE.Vector3(-size * 0.35, size * 1.35, 0),
            ];
            const curve = new THREE.CatmullRomCurve3(pts);
            const geo = new THREE.TubeGeometry(curve, 30, size * 0.42, 14, false);
            return this._addTubeDetail(geo, curve, size * 0.42,
                t => 1.0 - 0.45 * t,                 // 尾端变细
                () => ({ x: 1.0, y: 0.55, z: 0.75 }) // 背腹压扁
            );
        }
        if (id === 'amygdala') {
            return this._createAmygdalaGeometry(size);
        }
        if (id.startsWith('thalamus')) {
            return this._createThalamusGeometry(size);
        }
        if (id === 'caudate') {
            // 尾状核：C 形大弯，头膨大、尾尖细
            const pts = [
                new THREE.Vector3(0, -size * 0.5, 0),
                new THREE.Vector3(size * 0.4, 0, -size * 0.55),
                new THREE.Vector3(0, size * 0.9, -size * 0.4),
                new THREE.Vector3(-size * 0.35, size * 1.45, 0),
            ];
            const curve = new THREE.CatmullRomCurve3(pts);
            const geo = new THREE.TubeGeometry(curve, 32, size * 0.38, 14, false);
            return this._addTubeDetail(geo, curve, size * 0.38,
                t => 1.0 + 0.55 * Math.sin(Math.PI * (1 - t)), // 头部膨大
                () => ({ x: 1.0, y: 0.6, z: 0.8 })
            );
        }
        if (id === 'putamen') {
            return this._createLensGeometry(size, 0.45, true);
        }
        if (id === 'pallidum') {
            return this._createLensGeometry(size, 0.55, true);
        }
        if (id.startsWith('cereb_') || id === 'vermis' || id === 'dentate') {
            if (id === 'cereb_hemi_L' || id === 'cereb_hemi_R') {
                return this._createCerebellarHemisphereGeometry(size);
            }
            if (id === 'vermis') {
                return this._createVermisGeometry(size);
            }
            // 小脑其它深部核团
            const geo = new THREE.IcosahedronGeometry(size, 3);
            geo.scale(1.1, 0.6, 0.9);
            this._addOrganicNoise(geo, size * 0.03);
            return geo;
        }
        if (id.startsWith('cc_')) {
            return this._createCCGeometry(size);
        }
        if (id.includes('ventricle')) {
            return this._createVentricleGeometry(size, id);
        }
        // fallback
        const geo = new THREE.IcosahedronGeometry(size, 3);
        geo.scale(1, 1.2, 0.8);
        this._addOrganicNoise(geo, size * 0.03);
        return geo;
    }

    addSubcorticalStructures(structures) {
        if (!this._subcorticalBumpMap) {
            this._subcorticalBumpMap = this._createProceduralBumpTexture();
        }
        structures.forEach(s => {
            const pos = this.getSubcorticalPosition(s.id);
            const size = this.getSubcorticalSize(s.id);
            const geo = this._createSubcorticalGeometry(s.id, size);
            const col = new THREE.Color(s.color);
            const isVentricle = s.id.includes('ventricle');
            const mat = new THREE.MeshStandardMaterial({
                color: col,
                roughness: isVentricle ? 0.65 : 0.4,
                metalness: 0.05,
                emissive: col.clone().multiplyScalar(0.12),
                emissiveIntensity: isVentricle ? 0.02 : 0.04,
                bumpMap: this._subcorticalBumpMap,
                bumpScale: size * 0.04,
                depthTest: true,
                depthWrite: true,
                transparent: isVentricle,
                opacity: isVentricle ? 0.88 : 1.0,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.renderOrder = 10;
            mesh.userData = {
                type: 'subcortical',
                id: s.id,
                name: s.name,
                region: s.region,
                color: s.color,
            };
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            this.brainGroup.add(mesh);
            this.subcorticalMeshes.push(mesh);
            this.regionMap[s.id] = mesh;
        });
    }

    getSubcorticalPosition(id) {
        const positions = {
            'ca1': { x: 22, y: -18, z: -18 },
            'ca2': { x: 24, y: -20, z: -16 },
            'ca3': { x: 26, y: -22, z: -14 },
            'ca4': { x: 28, y: -24, z: -12 },
            'dg': { x: 20, y: -16, z: -20 },
            'amygdala': { x: 24, y: -10, z: -25 },
            'thalamus_ant': { x: 12, y: -15, z: -8 },
            'thalamus_med': { x: 10, y: -17, z: -6 },
            'thalamus_pul': { x: 8, y: -20, z: -4 },
            'caudate': { x: 15, y: 8, z: 5 },
            'putamen': { x: 25, y: 2, z: -5 },
            'pallidum': { x: 18, y: -4, z: -3 },
            'cereb_ant': { x: 0, y: -50, z: -55 },
            'cereb_post': { x: 0, y: -55, z: -65 },
            'cereb_flocc': { x: 30, y: -60, z: -70 },
            'vermis': { x: 0, y: -55, z: -60 },
            'cereb_hemi_L': { x: -28, y: -55, z: -62 },
            'cereb_hemi_R': { x: 28, y: -55, z: -62 },
            'dentate': { x: 15, y: -50, z: -68 },
            'cc_genu': { x: 0, y: 15, z: 8 },
            'cc_body': { x: 0, y: 5, z: 15 },
            'cc_splenium': { x: 0, y: -20, z: 10 },
            'lat_ventricle': { x: 16, y: 0, z: 8 },
            'third_ventricle': { x: 0, y: -8, z: 5 },
            'fourth_ventricle': { x: 0, y: -35, z: -45 },
        };
        return positions[id] || { x: 0, y: 0, z: 0 };
    }

    getSubcorticalSize(id) {
        const sizes = {
            'ca1': 4.5, 'ca2': 4.0, 'ca3': 3.8, 'ca4': 3.5, 'dg': 5.0,
            'amygdala': 7.0,
            'thalamus_ant': 5.5, 'thalamus_med': 5.0, 'thalamus_pul': 5.5,
            'caudate': 7.5, 'putamen': 8.0, 'pallidum': 5.5,
            'cereb_ant': 12, 'cereb_post': 14, 'cereb_flocc': 6,
            'vermis': 8, 'cereb_hemi_L': 20, 'cereb_hemi_R': 20,
            'dentate': 5,
            'cc_genu': 6, 'cc_body': 7, 'cc_splenium': 8,
            'lat_ventricle': 10, 'third_ventricle': 4, 'fourth_ventricle': 5,
        };
        return sizes[id] || 5;
    }

    focusSubcorticalRegion(regionId) {
        // 先清除皮层聚焦，避免冲突
        this.clearCorticalFocus();

        // 1. 皮层按"圆柱体"模式：直接在原 mesh 上做半透明 + 加轮廓线
        ['left', 'right'].forEach(hemi => {
            const mesh = hemi === 'left' ? this.leftHemiMesh : this.rightHemiMesh;
            if (!mesh || !mesh.geometry) return;

            // 原 mesh 保持可见但半透明，并强制覆盖为淡白色（不再显示原始分区颜色）
            mesh.visible = true;
            mesh.material.vertexColors = false;
            mesh.material.color = new THREE.Color(0xf5f5f5);
            mesh.material.transparent = true;
            mesh.material.opacity = 0.12;
            mesh.material.depthWrite = false;
            mesh.material.emissive = new THREE.Color(0x000000);
            mesh.material.emissiveIntensity = 0;
            mesh.material.needsUpdate = true;

            // 轮廓线 overlay（与原 mesh 共享几何体）
            const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, 85);
            const edgesMat = new THREE.LineBasicMaterial({
                color: 0xffffff, transparent: true,
                opacity: 0.22, depthWrite: false,
            });
            const edges = new THREE.LineSegments(edgesGeo, edgesMat);
            edges.userData = { type: 'cortex-subctx-edges', hemisphere: hemi };
            this.brainGroup.add(edges);
            this.subCtxCortex.edges[hemi] = edges;
            this.subCtxCortex.meshes[hemi] = null; // 不用 context mesh
        });

        // 2. 皮下层：选中结构自显颜色，其他半透明
        const targetColor = new THREE.Color();
        this.subcorticalMeshes.forEach(m => {
            m.renderOrder = 15;
            if (m.userData.id === regionId) {
                targetColor.set(m.userData.color);
                m.material.depthTest = false;
                m.material.depthWrite = false;
                m.material.emissive = targetColor;
                m.material.emissiveIntensity = 0.25;
                m.material.roughness = 0.2;
                m.material.transparent = false;
                m.material.opacity = 1.0;
                m.material.needsUpdate = true;
            } else {
                m.material.depthTest = true;
                m.material.depthWrite = false;
                m.material.emissive = new THREE.Color(m.material.color).multiplyScalar(0.1);
                m.material.emissiveIntensity = 0.05;
                m.material.roughness = 0.7;
                m.material.opacity = 0.18;
                m.material.transparent = true;
                m.material.needsUpdate = true;
            }
        });

        this.currentFocusedRegion = regionId;
    }

    removeFocusRing() {
        if (this.focusRing) {
            this.brainGroup.remove(this.focusRing);
            if (this.focusRing.geometry) this.focusRing.geometry.dispose();
            if (this.focusRing.material) this.focusRing.material.dispose();
            this.focusRing = null;
        }
    }

    clearSubcorticalFocus() {
        // 移除皮层圆柱体模式的 context mesh 和轮廓线
        ['left', 'right'].forEach(hemi => {
            const cm = this.subCtxCortex.meshes[hemi];
            if (cm) {
                this.brainGroup.remove(cm);
                cm.geometry.dispose();
                cm.material.dispose();
                this.subCtxCortex.meshes[hemi] = null;
            }
            const ce = this.subCtxCortex.edges[hemi];
            if (ce) {
                this.brainGroup.remove(ce);
                ce.geometry.dispose();
                ce.material.dispose();
                this.subCtxCortex.edges[hemi] = null;
            }
        });

        // 恢复原始皮层 mesh
        ['left', 'right'].forEach(hemi => {
            const mesh = hemi === 'left' ? this.leftHemiMesh : this.rightHemiMesh;
            if (!mesh) return;
            mesh.visible = true;
            mesh.material.vertexColors = true;
            mesh.material.color = new THREE.Color(0xffffff);
            mesh.material.transparent = false;
            mesh.material.opacity = 1.0;
            mesh.material.depthWrite = true;
            mesh.material.emissive = new THREE.Color(0x000000);
            mesh.material.emissiveIntensity = 0;
            mesh.material.needsUpdate = true;
        });

        // 恢复所有皮下层结构
        this.subcorticalMeshes.forEach(m => {
            const col = new THREE.Color(m.userData.color || m.material.color);
            m.renderOrder = 10;
            m.material.depthTest = true;
            m.material.depthWrite = true;
            m.material.emissive = col.clone().multiplyScalar(0.15);
            m.material.emissiveIntensity = 0.05;
            m.material.roughness = 0.3;
            m.material.opacity = 1;
            m.material.transparent = false;
            m.material.needsUpdate = true;
        });

        this.removeFocusRing();
        this.currentFocusedRegion = null;
    }

    highlightRegion(regionId) {
        this.focusSubcorticalRegion(regionId);
    }

    clearHighlight() {
        this.clearSubcorticalFocus();
    }

    addFiberTract(points, color = '#FF6B6B', name = '') {
        const curve = new THREE.CatmullRomCurve3(
            points.map(p => new THREE.Vector3(p.x, p.y, p.z))
        );
        const tubePoints = curve.getPoints(120);
        const path = new THREE.BufferGeometry().setFromPoints(tubePoints);

        const material = new THREE.LineBasicMaterial({
            color: new THREE.Color(color),
            linewidth: 1,
            transparent: true,
            opacity: 0.85,
        });

        const line = new THREE.Line(path, material);
        line.userData = { type: 'tract', name, color };
        this.brainGroup.add(line);
        this.tractLines.push(line);
        return line;
    }

    generateDemoTracts() {
        this.tractLines.forEach(l => {
            this.brainGroup.remove(l);
            if (l.geometry) l.geometry.dispose();
            if (l.material) l.material.dispose();
        });
        this.tractLines = [];

        const tracts = [
            { name: 'arcuate', color: '#FF6B6B', generator: () => this.generateCurvedPath({ x: -45, y: 15, z: 8 }, { x: -50, y: -25, z: 5 }, { x: -55, y: -10, z: 25 }) },
            { name: 'cingulum', color: '#4ECDC4', generator: () => this.generateCurvedPath({ x: 5, y: 20, z: 5 }, { x: 5, y: -30, z: 8 }, { x: -5, y: 0, z: 20 }) },
            { name: 'cst', color: '#FFE66D', generator: () => this.generateCurvedPath({ x: 25, y: 35, z: 55 }, { x: 10, y: -20, z: 0 }, { x: 8, y: 20, z: 30 }) },
            { name: 'ilf', color: '#A8E6CF', generator: () => this.generateCurvedPath({ x: 35, y: -20, z: -40 }, { x: 30, y: 5, z: -30 }, { x: 25, y: -10, z: -15 }) },
            { name: 'slf', color: '#FF8B94', generator: () => this.generateCurvedPath({ x: -30, y: 30, z: 20 }, { x: -40, y: -20, z: 15 }, { x: -35, y: 5, z: 35 }) },
            { name: 'uncinate', color: '#C9B1FF', generator: () => this.generateCurvedPath({ x: 20, y: 25, z: -25 }, { x: 28, y: -5, z: -20 }, { x: 22, y: 10, z: -35 }) },
            {
                name: 'forcepsMajor', color: '#FFD93D', generator: () => [
                    ...this.generateCurvedPath({ x: -5, y: -25, z: 10 }, { x: 35, y: -45, z: -20 }, { x: 10, y: -35, z: -5 }),
                    ...this.generateCurvedPath({ x: -5, y: -25, z: 10 }, { x: -35, y: -45, z: -20 }, { x: -10, y: -35, z: -5 }),
                ],
            },
            {
                name: 'forcepsMinor', color: '#6BCB77', generator: () => [
                    ...this.generateCurvedPath({ x: -5, y: 18, z: 8 }, { x: 30, y: 20, z: -25 }, { x: 15, y: 20, z: -10 }),
                    ...this.generateCurvedPath({ x: -5, y: 18, z: 8 }, { x: -30, y: 20, z: -25 }, { x: -15, y: 20, z: -10 }),
                ],
            },
        ];

        tracts.forEach(t => {
            const pts = t.generator();
            this.addFiberTract(pts, t.color, t.name);
        });
    }

    generateCurvedPath(start, end, control) {
        const points = [];
        const steps = 50;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x;
            const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y;
            const z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * control.z + t * t * end.z;
            points.push({ x, y, z });
        }
        return points;
    }

    addNetworkOverlay(networks) {
        if (this.activationOverlay) {
            this.brainGroup.remove(this.activationOverlay);
            this.activationOverlay.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
        }

        const group = new THREE.Group();
        const radius = 88;

        networks.forEach((net, ni) => {
            const netColor = new THREE.Color(net.color);
            const count = 300;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);

            for (let i = 0; i < count; i++) {
                let phiBias, thetaBias;
                switch (ni) {
                    case 0: phiBias = 2.0 + Math.random() * 1.1; thetaBias = Math.random() * Math.PI * 2; break;
                    case 1: phiBias = 0.8 + Math.random() * 0.8; thetaBias = Math.random() * Math.PI * 2; break;
                    case 2: phiBias = 1.2 + Math.random() * 0.6; thetaBias = Math.random() * Math.PI * 2; break;
                    case 3: phiBias = 1.5 + Math.random() * 0.5; thetaBias = 1.0 + Math.random() * 1.0; break;
                    case 4: phiBias = 1.8 + Math.random() * 0.5; thetaBias = 1.8 + Math.random() * 0.8; break;
                    case 5: phiBias = 0.5 + Math.random() * 1.0; thetaBias = Math.random() * Math.PI * 2; break;
                    case 6: phiBias = (Math.random() < 0.5 ? 0.3 : 2.5) + Math.random() * 0.4; thetaBias = Math.random() * Math.PI * 2; break;
                    default: phiBias = Math.random() * Math.PI; thetaBias = Math.random() * Math.PI * 2;
                }

                const r = radius + (Math.random() - 0.5) * 15;
                positions[i * 3] = r * Math.sin(phiBias) * Math.cos(thetaBias);
                positions[i * 3 + 1] = r * Math.sin(phiBias) * Math.sin(thetaBias);
                positions[i * 3 + 2] = r * Math.cos(phiBias);

                colors[i * 3] = netColor.r;
                colors[i * 3 + 1] = netColor.g;
                colors[i * 3 + 2] = netColor.b;
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const mat = new THREE.PointsMaterial({
                size: 2.5,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                transparent: true,
                opacity: 0.7,
            });

            group.add(new THREE.Points(geo, mat));
        });

        this.activationOverlay = group;
        this.brainGroup.add(group);
    }

    addActivationOverlay(activations) {
        if (this.activationOverlay) {
            this.brainGroup.remove(this.activationOverlay);
            this.activationOverlay.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
        }

        const group = new THREE.Group();
        const radius = 86;

        activations.forEach(act => {
            const count = 80;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);

            for (let i = 0; i < count; i++) {
                const phi = act.phi + (Math.random() - 0.5) * 0.4;
                const theta = act.theta + (Math.random() - 0.5) * 0.4;
                const r = radius + (Math.random() - 0.5) * 10;

                positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = r * Math.cos(phi);

                const intensity = 0.5 + Math.random() * 0.5;
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = intensity * 0.8;
                colors[i * 3 + 2] = intensity * 0.2;
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const mat = new THREE.PointsMaterial({
                size: 3.5,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                transparent: true,
                opacity: 0.55,
            });

            group.add(new THREE.Points(geo, mat));
        });

        this.activationOverlay = group;
        this.brainGroup.add(group);
    }

    removeOverlay() {
        if (this.activationOverlay) {
            this.brainGroup.remove(this.activationOverlay);
            this.activationOverlay.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
            this.activationOverlay = null;
        }
    }

    setTractVisibility(tractName, visible) {
        this.tractLines.forEach(line => {
            if (!tractName || tractName === 'all' || line.userData.name === tractName) {
                line.visible = visible;
            }
        });
    }

    removeAllTracts() {
        this.tractLines.forEach(l => {
            this.brainGroup.remove(l);
            if (l.geometry) l.geometry.dispose();
            if (l.material) l.material.dispose();
        });
        this.tractLines = [];
    }

    onClick(event) {
        // 拖拽旋转时忽略点击，避免误跳转
        if (this._dragMoved) {
            this._dragMoved = false;
            return;
        }

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 收集所有可点击对象，包括聚焦状态下生成的 focus/context mesh
        const clickable = [
            ...this.subcorticalMeshes,
            this.leftHemiMesh,
            this.rightHemiMesh,
        ].filter(Boolean);

        // 如果皮层处于聚焦状态，原始 mesh 已被隐藏，需要检测 focus/context mesh
        ['left', 'right'].forEach(hemi => {
            if (this.focusMeshes[hemi]) clickable.push(this.focusMeshes[hemi]);
            if (this.contextMeshes[hemi]) clickable.push(this.contextMeshes[hemi]);
        });

        const intersects = this.raycaster.intersectObjects(clickable);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const obj = hit.object;
            if (obj.userData && this.options.onRegionClick) {
                const userData = { ...obj.userData };

                // 如果命中的是 focus/context mesh，将其映射回原始皮层 mesh 的 userData
                if (userData.type === 'cortex-focus' || userData.type === 'cortex-context') {
                    userData.type = 'cortex';
                    // 从原始皮层 mesh 获取 hemisphere
                    const origMesh = userData.hemisphere === 'left' ? this.leftHemiMesh : this.rightHemiMesh;
                    if (origMesh && origMesh.geometry) {
                        userData.hemisphere = userData.hemisphere || origMesh.userData.hemisphere;
                    }
                }

                // 皮层点击：根据命中面顶点颜色反查区域 ID
                if (userData.type === 'cortex' && hit.face) {
                    let geo = obj.geometry;
                    // focus/context mesh 的几何体是原始皮层几何体的克隆，直接在它上面查颜色
                    // 但因为它们替换了顶点颜色，所以需要用原始顶点颜色来查
                    const hem = userData.hemisphere || 'left';
                    const origColors = this.originalVertexColors[hem];
                    const colorAttr = geo.attributes.color;
                    if (origColors && colorAttr) {
                        // 用原始颜色做区域匹配（基于顶点索引）
                        const regionId = this._getCorticalRegionIdFromFace(geo, hit.face,
                            origColors.length > 0 ? origColors : null);
                        if (regionId) userData.regionId = regionId;
                    } else {
                        const regionId = this._getCorticalRegionIdFromFace(geo, hit.face);
                        if (regionId) userData.regionId = regionId;
                    }
                }
                this.options.onRegionClick(userData);
            }
        }
    }

    _getCorticalRegionIdFromFace(geometry, face, colorArrayOverride) {
        const colorAttr = geometry.attributes.color;
        if (!colorAttr) return null;
        const arr = colorArrayOverride || colorAttr.array;
        const atlasRegions = (typeof ATLAS_REGIONS !== 'undefined' ? ATLAS_REGIONS[this.currentAtlas] : []) || [];
        const colorToId = {};
        for (const region of atlasRegions) {
            colorToId[region.color.toLowerCase()] = region.id;
        }
        // 预构建颜色查找表
        const refColors = [];
        for (const [hex, id] of Object.entries(colorToId)) {
            const h = hex.replace('#', '');
            refColors.push({
                r: parseInt(h.substring(0, 2), 16) / 255,
                g: parseInt(h.substring(2, 4), 16) / 255,
                b: parseInt(h.substring(4, 6), 16) / 255,
                id: id
            });
        }
        const threshold = 0.002;
        for (const vi of [face.a, face.b, face.c]) {
            const idx3 = vi * 3;
            const r = arr[idx3];
            const g = arr[idx3 + 1];
            const b = arr[idx3 + 2];
            for (const ref of refColors) {
                if (Math.abs(r - ref.r) < threshold &&
                    Math.abs(g - ref.g) < threshold &&
                    Math.abs(b - ref.b) < threshold) {
                    return ref.id;
                }
            }
        }
        return null;
    }

    onMouseMove(event) {
        this._lastClientX = event.clientX;
        this._lastClientY = event.clientY;

        // 立即更新 tooltip DOM 位置，无论是否已显示，确保零延迟跟手
        if (this._tooltip) {
            this._tooltip.style.left = (event.clientX + 14) + 'px';
            this._tooltip.style.top = (event.clientY + 14) + 'px';
        }

        // 跟踪拖拽位移：移动超过阈值则标记为拖拽
        if (this._dragStartX >= 0) {
            const dx = event.clientX - this._dragStartX;
            const dy = event.clientY - this._dragStartY;
            if (Math.abs(dx) > this._DRAG_THRESHOLD || Math.abs(dy) > this._DRAG_THRESHOLD) {
                this._dragMoved = true;
            }
        }

        // 拖拽旋转时跳过射线检测，减少计算
        if (this._dragMoved) return;

        // 节流到约 30fps（每 33ms 执行一次射线检测），避免卡顿
        const now = performance.now();
        if (now - this._lastRaycastTime < 33) return;
        this._lastRaycastTime = now;

        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = this._lastClientX - rect.left;
        const y = this._lastClientY - rect.top;
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            this._hoverRegionId = null;
            this._hideTooltip();
            return;
        }
        this.mouse.x = (x / rect.width) * 2 - 1;
        this.mouse.y = -(y / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const clickable = [
            ...this.subcorticalMeshes,
            this.leftHemiMesh,
            this.rightHemiMesh,
        ].filter(Boolean);
        ['left', 'right'].forEach(hemi => {
            if (this.focusMeshes[hemi]) clickable.push(this.focusMeshes[hemi]);
            if (this.contextMeshes[hemi]) clickable.push(this.contextMeshes[hemi]);
        });

        const intersects = this.raycaster.intersectObjects(clickable);
        const hit = intersects.length > 0 ? intersects[0] : null;

        this.renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';

        if (hit) {
            const regionId = this._getRegionIdFromHit(hit);
            this._hoverRegionId = regionId;
            if (regionId) {
                this._showTooltip(this._lastClientX, this._lastClientY, regionId);
            } else {
                this._hideTooltip();
            }
        } else {
            this._hoverRegionId = null;
            this._hideTooltip();
        }
    }

    _getRegionIdFromHit(hit) {
        const obj = hit.object;
        if (!obj || !hit.face) return null;
        const userData = obj.userData || {};

        // 皮层区域：根据命中面顶点颜色反查 ID
        if (userData.type === 'cortex' || userData.type === 'cortex-focus' || userData.type === 'cortex-context') {
            const hem = userData.hemisphere || 'left';
            const origColors = this.originalVertexColors[hem];
            const regionId = this._getCorticalRegionIdFromFace(obj.geometry, hit.face,
                origColors && origColors.length > 0 ? origColors : null);
            return regionId;
        }

        // 皮层下结构：直接返回 ID
        if (userData.id) return userData.id;

        return null;
    }

    _createTooltip() {
        const el = document.createElement('div');
        el.className = 'brain-tooltip';
        el.style.cssText = 'position:fixed;z-index:9999;padding:6px 10px;border-radius:6px;background:rgba(10,10,20,0.9);color:#fff;font-size:12px;pointer-events:none;opacity:0;visibility:hidden;transition:opacity 0.06s,visibility 0.06s;white-space:nowrap;border:1px solid rgba(0,188,212,0.4);box-shadow:0 4px 12px rgba(0,0,0,0.35);';
        document.body.appendChild(el);
        return el;
    }

    _showTooltip(clientX, clientY, regionId) {
        if (!this._tooltip) return;
        const atlasRegions = (typeof ATLAS_REGIONS !== 'undefined' ? ATLAS_REGIONS[this.currentAtlas] : []) || [];
        const subMap = (typeof SUBCORTICAL_STRUCTURES !== 'undefined' ? SUBCORTICAL_STRUCTURES : []) || [];
        const found = atlasRegions.find(r => r.id === regionId) || subMap.find(r => r.id === regionId);
        const name = found ? found.name : regionId;
        this._tooltip.textContent = name;
        this._tooltip.style.left = (clientX + 14) + 'px';
        this._tooltip.style.top = (clientY + 14) + 'px';
        this._tooltip.style.visibility = 'visible';
        this._tooltip.style.opacity = '1';
    }

    _hideTooltip() {
        if (!this._tooltip) return;
        this._tooltip.style.opacity = '0';
        this._tooltip.style.visibility = 'hidden';
    }

    onResize() {
        const { width, height } = this.container.getBoundingClientRect();
        if (width === 0 || height === 0) return;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        this.animId = requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        // 让光源跟随相机，始终面向用户一侧打光
        this._updateLightsToCamera();

        // 脉冲光环动画
        if (this.focusRing) {
            const t = performance.now() * 0.001; // 秒
            const pulse = 1 + Math.sin(t * 3) * 0.2;
            this.focusRing.scale.setScalar(pulse);
            this.focusRing.material.opacity = 0.5 + Math.sin(t * 3) * 0.4;
        }

        this.renderer.render(this.scene, this.camera);

        if (window.updateFPS) {
            window.updateFPS();
        }
    }

    fitCameraToBrain() {
        const box = new THREE.Box3().setFromObject(this.brainGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        this.brainCenter = center.clone();
        this.brainSize = maxDim;

        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        }

        // 保存距离限制，用于动画循环中手动钳制
        this._minCameraDistance = Math.max(40, maxDim * 0.35);
        this._maxCameraDistance = Math.max(700, maxDim * 2.5);

        // 如果当前相机距离过远/过近，自动调整到合适位置
        const idealDist = maxDim * 1.6;
        if (this.camera) {
            const currentDist = this.camera.position.distanceTo(center);
            if (currentDist < this._minCameraDistance || currentDist > this._maxCameraDistance * 0.8) {
                this.camera.position.set(center.x, center.y + maxDim * 0.15, center.z + idealDist);
            }
        }
    }

    resetView() {
        const center = this.brainCenter || new THREE.Vector3(0, 0, 0);
        const maxDim = this.brainSize || 180;
        const idealDist = maxDim * 1.6;
        this.camera.position.set(center.x, center.y + maxDim * 0.15, center.z + idealDist);
        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        }
    }

    screenshot() {
        this.renderer.render(this.scene, this.camera);
        return this.renderer.domElement.toDataURL('image/png');
    }

    dispose() {
        if (this.animId) cancelAnimationFrame(this.animId);
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentElement) {
                this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
            }
        }
    }

    // 返回指定 HCP 区域在当前 OBJ 模型中的顶点数
    getRegionVertexCount(regionId) {
        if (!this._regionAnalysis || !this._regionAnalysis.regionCounts) return null;
        return this._regionAnalysis.regionCounts[regionId] || 0;
    }
}

class SliceViewer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.sliceIndex = 50;
        this.orientation = canvasId.replace('canvas', '').toLowerCase();
        this.resize();
    }

    resize() {
        const parent = this.canvas.parentElement;
        const w = parent.clientWidth;
        const h = parent.clientHeight - 24;
        this.canvas.width = w;
        this.canvas.height = Math.max(h, 150);
        this.render();
    }

    setSlice(index) {
        this.sliceIndex = index;
        this.render();
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.42;

        this.drawBrainSlice(ctx, cx, cy, radius);

        ctx.strokeStyle = '#00BCD4';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
        ctx.moveTo(0, cy); ctx.lineTo(w, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#00BCD4';
        ctx.font = '10px monospace';
        ctx.fillText(`Slice: ${this.sliceIndex}%`, 8, h - 8);
    }

    drawBrainSlice(ctx, cx, cy, r) {
        const t = this.sliceIndex / 100;
        ctx.save();
        ctx.beginPath();

        if (this.orientation === 'axial') {
            const midDist = Math.abs(t - 0.5) * 2;
            const scale = 0.6 + (1 - midDist) * 0.4;
            ctx.ellipse(cx, cy, r * scale * 0.9, r * scale * 0.7, 0, 0, Math.PI * 2);
        } else if (this.orientation === 'sagittal') {
            const scale = 0.5 + (1 - Math.abs(t - 0.5) * 2) * 0.5;
            ctx.ellipse(cx, cy, r * scale * 0.65, r * scale * 0.85, 0, 0, Math.PI * 2);
        } else {
            const scale = 0.55 + (1 - Math.abs(t - 0.5) * 2) * 0.45;
            ctx.ellipse(cx, cy, r * scale * 0.8, r * scale * 0.75, 0, 0, Math.PI * 2);
        }

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, '#4a4a6a');
        gradient.addColorStop(0.5, '#3a3a5a');
        gradient.addColorStop(0.8, '#2a2a4a');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = '#00BCD466';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (this.orientation === 'axial') {
            ctx.beginPath();
            ctx.ellipse(cx, cy, r * 0.25, r * 0.2, 0, 0, Math.PI * 2);
            ctx.strokeStyle = '#FF980066';
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(cx - r * 0.08, cy, r * 0.06, r * 0.1, 0.2, 0, Math.PI * 2);
            ctx.ellipse(cx + r * 0.08, cy, r * 0.06, r * 0.1, -0.2, 0, Math.PI * 2);
            ctx.fillStyle = '#0a0a14';
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(cx - r * 0.18, cy + r * 0.05, r * 0.06, r * 0.04, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + r * 0.18, cy + r * 0.05, r * 0.06, r * 0.04, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#448AFF44';
            ctx.fill();
            ctx.strokeStyle = '#448AFF88';
            ctx.stroke();
        }

        ctx.restore();
    }

    dispose() {
        // Cleanup
    }
}

window.BrainViewer = BrainViewer;
window.SliceViewer = SliceViewer;
window.THREE = THREE;
