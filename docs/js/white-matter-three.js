import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LineSegments2 } from '../vendor/three/lines/LineSegments2.js';
import { LineSegmentsGeometry } from '../vendor/three/lines/LineSegmentsGeometry.js';
import { LineMaterial } from '../vendor/three/lines/LineMaterial.js';

const BLACK = 0x000000;
const GLASS_COLOR = new THREE.Color(0xd9dee5);

function parseMZ3(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    if (view.getUint16(0, true) !== 23117) {
        throw new Error('不是有效的 MZ3 网格文件');
    }
    const flags = view.getUint16(2, true);
    const faceCount = view.getUint32(4, true);
    const vertexCount = view.getUint32(8, true);
    if (!(flags & 1) || !(flags & 2)) {
        throw new Error('MZ3 文件缺少顶点或三角面数据');
    }
    let offset = 16;
    const faces = new Uint32Array(arrayBuffer.slice(
        offset,
        offset + faceCount * 3 * Uint32Array.BYTES_PER_ELEMENT,
    ));
    offset += faceCount * 3 * Uint32Array.BYTES_PER_ELEMENT;
    const vertices = new Float32Array(arrayBuffer.slice(
        offset,
        offset + vertexCount * 3 * Float32Array.BYTES_PER_ELEMENT,
    ));
    return { faces, vertices };
}

function directionColor(ax, ay, az, bx, by, bz) {
    const dx = Math.abs(bx - ax);
    const dy = Math.abs(by - ay);
    const dz = Math.abs(bz - az);
    const total = dx + dy + dz || 1;
    const power = 2.4;
    const rx = Math.pow(dx / total, power);
    const gy = Math.pow(dy / total, power);
    const bzBlue = Math.pow(dz / total, power);
    const peak = rx + gy + bzBlue || 1;
    const floor = 0.12;
    return [
        floor + (rx / peak) * (1 - floor),
        floor + (gy / peak) * (1 - floor),
        floor + (bzBlue / peak) * (1 - floor),
    ];
}

export class WhiteMatterThreeViewer {
    constructor(container, options = {}) {
        this.container = container;
        this.dataUrl = options.dataUrl;
        this.glassUrl = options.glassUrl;
        this.bundleDefinitions = options.bundleDefinitions || [];
        this.minLength = options.minLength ?? 40;
        this.decimationStride = options.decimationStride ?? 4;
        this.fiberRadius = options.fiberRadius ?? 1.2;
        this.glassVisible = options.glassVisible ?? true;
        this.endpointSnapRadius = options.endpointSnapRadius ?? 28;
        this.activeTract = 'overview';
        this.functionalOverlayId = null;
        this.categoryMeshes = new Map();
        this.networkMeshes = new Map();
        this.streamlineLengths = null;
        this.streamlineCategories = null;
        this.tractData = null;
        this.renderedStreamlineIds = [];
        this.visibleStreamlineIds = [];
        this.visibleStreamlines = 0;
        this.filterValidation = null;
        this.modelCenter = new THREE.Vector3(0, -12, 12);
        this.defaultCameraOffset = new THREE.Vector3(-360, -318, 133);
        this._needsRender = true;
        this._animationFrame = null;
        this._disposed = false;
    }

    async init(tractData) {
        this._createRenderer();
        this._createScene();
        this.tractData = tractData;
        this._prepareStreamlineMetadata();
        await this._loadGlassBrain();
        await this.rebuildFibers();
        this._updateCameraPivot();
        this._startRenderLoop();
        this.resize();
        return this;
    }

    async loadTractData(tractData, options = {}) {
        this.tractData = tractData;
        this._prepareStreamlineMetadata();
        await this.rebuildFibers();
        this._updateCameraPivot();
        if (options.resetActive !== false) {
            this.setActiveTract(options.activeTract || 'all');
        }
        return this.getStats();
    }

    _createRenderer() {
        this.container.querySelectorAll('canvas').forEach((canvas) => canvas.remove());
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('three-fiber-canvas');
        this.canvas.style.cssText = 'width:100%;height:100%;display:block;background:#000;';
        this.container.appendChild(this.canvas);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true,
        });
        this.renderer.setClearColor(BLACK, 1);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
    }

    _createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(BLACK);

        this.camera = new THREE.PerspectiveCamera(34, 1, 1, 1600);
        this.camera.up.set(0, 0, 1);
        this.camera.position.set(-360, -330, 145);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.target.set(0, -12, 12);
        this.controls.enableDamping = false;
        this.controls.rotateSpeed = 0.72;
        this.controls.zoomSpeed = 0.82;
        this.controls.panSpeed = 0.72;
        this.controls.enablePan = true;
        this.controls.screenSpacePanning = true;
        this.controls.zoomToCursor = false;
        this.controls.minPolarAngle = -Infinity;
        this.controls.maxPolarAngle = Infinity;
        this.controls.minAzimuthAngle = -Infinity;
        this.controls.maxAzimuthAngle = Infinity;
        this.controls.minDistance = 170;
        this.controls.maxDistance = 950;
        this.controls.addEventListener('change', () => {
            this._needsRender = true;
        });
        this._cameraPivotPointerHandler = (event) => {
            if (event.button === 0) this._updateCameraPivot();
        };
        this._cameraPivotWheelHandler = () => {
            this._updateCameraPivot();
        };
        this.canvas.addEventListener('pointerdown', this._cameraPivotPointerHandler, { capture: true });
        this.canvas.addEventListener('wheel', this._cameraPivotWheelHandler, { capture: true, passive: true });
        this.controls.update();

        this.scene.add(new THREE.HemisphereLight(0xf4f7fb, 0x263241, 1.25));
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
        keyLight.position.set(180, 220, 260);
        const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.55);
        fillLight.position.set(-220, -80, 180);
        this.scene.add(keyLight, fillLight);

        this.spatialRoot = new THREE.Group();
        this.spatialRoot.name = 'white-matter-spatial-root';
        this.scene.add(this.spatialRoot);

        this.fiberRoot = new THREE.Group();
        this.fiberRoot.name = 'fiber-tracts';
        this.spatialRoot.add(this.fiberRoot);

        this.networkRoot = new THREE.Group();
        this.networkRoot.name = 'functional-networks';
        this.spatialRoot.add(this.networkRoot);

        this.glassRoot = new THREE.Group();
        this.glassRoot.name = 'glass-brain';
        this.spatialRoot.add(this.glassRoot);
    }

    _prepareStreamlineMetadata() {
        const { points, offsets, groups } = this.tractData;
        const streamlineCount = offsets.length - 1;
        this.streamlineLengths = new Float32Array(streamlineCount);
        this.streamlineCategories = new Int16Array(streamlineCount);
        this.streamlineCategories.fill(-1);

        for (let streamlineId = 0; streamlineId < streamlineCount; streamlineId++) {
            const start = offsets[streamlineId];
            const end = offsets[streamlineId + 1];
            let length = 0;
            for (let pointIndex = start + 1; pointIndex < end; pointIndex++) {
                const a = pointIndex - 1;
                const b = pointIndex;
                const dx = points[b * 3] - points[a * 3];
                const dy = points[b * 3 + 1] - points[a * 3 + 1];
                const dz = points[b * 3 + 2] - points[a * 3 + 2];
                length += Math.hypot(dx, dy, dz);
            }
            this.streamlineLengths[streamlineId] = length;
        }

        const groupLookup = new Map(
            (groups || []).map((group) => [String(group.id), group.vals])
        );
        this.bundleDefinitions.forEach((bundle, categoryIndex) => {
            for (const groupId of bundle.groups || []) {
                const values = groupLookup.get(groupId);
                if (!values) continue;
                for (const value of values) {
                    const streamlineId = Number(value);
                    if (
                        Number.isInteger(streamlineId)
                        && streamlineId >= 0
                        && streamlineId < streamlineCount
                        && this.streamlineCategories[streamlineId] < 0
                    ) {
                        this.streamlineCategories[streamlineId] = categoryIndex;
                    }
                }
            }
        });
        this.categoryCount = this.bundleDefinitions.length;
        this.otherCategory = this.categoryCount;
    }

    async _loadGlassBrain() {
        const response = await fetch(this.glassUrl);
        if (!response.ok) throw new Error(`玻璃脑加载失败：HTTP ${response.status}`);
        const { faces, vertices } = parseMZ3(await response.arrayBuffer());
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(faces, 1));
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();

        // 与功能网络视图统一的浅灰树脂材质；透明度略高于该视图默认值，减少对纤维的遮挡。
        const material = new THREE.MeshStandardMaterial({
            color: GLASS_COLOR,
            roughness: 0.78,
            metalness: 0.015,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            blending: THREE.NormalBlending,
        });
        this.glassMesh = new THREE.Mesh(geometry, material);
        this.glassMesh.renderOrder = 2;
        this.glassMesh.visible = this.glassVisible;
        this.glassRoot.add(this.glassMesh);
    }

    _removeFiberPointObjects() {
        const pointObjects = [...this.fiberRoot.children].filter((object) =>
            object.isPoints
            || object.type === 'Points'
            || object.material?.isPointsMaterial
        );
        pointObjects.forEach((object) => {
            this.fiberRoot.remove(object);
            object.geometry?.dispose?.();
            object.material?.dispose?.();
        });
        this.fiberPointObjectsRemoved = (this.fiberPointObjectsRemoved || 0) + pointObjects.length;
        return pointObjects.length;
    }

    validateFiberRenderMode() {
        const pointObjects = [...this.fiberRoot.children].filter((object) =>
            object.isPoints
            || object.type === 'Points'
            || object.material?.isPointsMaterial
        );
        const lineObjects = [...this.fiberRoot.children].filter((object) =>
            object.type === 'LineSegments2'
        );
        const expectedLineObjects = this.categoryMeshes.size * 2;
        const valid = pointObjects.length === 0 && lineObjects.length === expectedLineObjects;
        return {
            valid,
            pointObjects: pointObjects.length,
            lineObjects: lineObjects.length,
            expectedLineObjects,
        };
    }

    _streamlineBounds(streamlineId) {
        const points = this.tractData.points;
        const offsets = this.tractData.offsets;
        const start = offsets[streamlineId];
        const end = offsets[streamlineId + 1];
        if (end - start < 2) return null;

        let minX = Infinity;
        let minY = Infinity;
        let minZ = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let maxZ = -Infinity;
        for (let pointIndex = start; pointIndex < end; pointIndex++) {
            const x = points[pointIndex * 3];
            const y = points[pointIndex * 3 + 1];
            const z = points[pointIndex * 3 + 2];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            minZ = Math.min(minZ, z);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            maxZ = Math.max(maxZ, z);
        }
        return { minX, minY, minZ, maxX, maxY, maxZ };
    }

    async rebuildFibers() {
        if (!this.tractData) return;
        this._removeFiberPointObjects();
        const { points, offsets } = this.tractData;
        const streamlineCount = offsets.length - 1;
        const segmentCounts = new Uint32Array(this.categoryCount + 1);
        const selectedIds = Array.from(
            { length: this.categoryCount + 1 },
            () => [],
        );
        const renderedStreamlineIds = [];

        for (let streamlineId = 0; streamlineId < streamlineCount; streamlineId++) {
            if (streamlineId % this.decimationStride !== 0) continue;
            if (this.streamlineLengths[streamlineId] < this.minLength) continue;
            if (offsets[streamlineId + 1] - offsets[streamlineId] < 2) continue;
            const category = this.streamlineCategories[streamlineId];
            const categoryIndex = category >= 0 ? category : this.otherCategory;
            selectedIds[categoryIndex].push(streamlineId);
            renderedStreamlineIds.push(streamlineId);
            segmentCounts[categoryIndex] += offsets[streamlineId + 1] - offsets[streamlineId] - 1;
        }

        for (const entry of this.categoryMeshes.values()) {
            this.fiberRoot.remove(entry.core);
            this.fiberRoot.remove(entry.glow);
            entry.geometry.dispose();
            entry.core.material.dispose();
            entry.glow.material.dispose();
        }
        this.categoryMeshes.clear();

        for (let categoryIndex = 0; categoryIndex < segmentCounts.length; categoryIndex++) {
            const segmentCount = segmentCounts[categoryIndex];
            if (!segmentCount) continue;
            const positions = new Float32Array(segmentCount * 6);
            const colors = new Float32Array(segmentCount * 6);
            let cursor = 0;

            for (const streamlineId of selectedIds[categoryIndex]) {
                const start = offsets[streamlineId];
                const end = offsets[streamlineId + 1];
                for (let pointIndex = start + 1; pointIndex < end; pointIndex++) {
                    const a = pointIndex - 1;
                    const b = pointIndex;
                    const ax = points[a * 3];
                    const ay = points[a * 3 + 1];
                    const az = points[a * 3 + 2];
                    const bx = points[b * 3];
                    const by = points[b * 3 + 1];
                    const bz = points[b * 3 + 2];
                    positions[cursor] = ax;
                    positions[cursor + 1] = ay;
                    positions[cursor + 2] = az;
                    positions[cursor + 3] = bx;
                    positions[cursor + 4] = by;
                    positions[cursor + 5] = bz;
                    const color = directionColor(ax, ay, az, bx, by, bz);
                    colors[cursor] = color[0];
                    colors[cursor + 1] = color[1];
                    colors[cursor + 2] = color[2];
                    colors[cursor + 3] = color[0];
                    colors[cursor + 4] = color[1];
                    colors[cursor + 5] = color[2];
                    cursor += 6;
                }
            }

            const geometry = new LineSegmentsGeometry();
            geometry.setPositions(positions);
            geometry.setColors(colors);
            geometry.computeBoundingSphere();

            const category = this.bundleDefinitions[categoryIndex];
            const coreMaterial = this._createLineMaterial({
                linewidth: this.fiberRadius,
                opacity: 0.64,
                blending: THREE.NormalBlending,
            });
            const glowMaterial = this._createLineMaterial({
                linewidth: this.fiberRadius * 3.4,
                opacity: 0.08,
                blending: THREE.AdditiveBlending,
            });
            const core = new LineSegments2(geometry, coreMaterial);
            const glow = new LineSegments2(geometry, glowMaterial);
            core.frustumCulled = false;
            glow.frustumCulled = false;
            core.renderOrder = 3;
            glow.renderOrder = 1;
            this.fiberRoot.add(glow, core);
            this.categoryMeshes.set(categoryIndex, {
                geometry,
                core,
                glow,
                category,
                streamlineCount: selectedIds[categoryIndex].length,
            });
        }
        this.renderedStreamlineIds = renderedStreamlineIds;
        this.applyTractFocus();
        this.resizeMaterials();
        this._updateVisibleCount();
        this._updateFunctionalOverlayEndpoints();
        this.filterValidation = this.validateFiberFilter();
        this._needsRender = true;
        this.renderer?.render(this.scene, this.camera);
    }

    _createLineMaterial({ linewidth, opacity, blending }) {
        const material = new LineMaterial({
            color: 0xffffff,
            vertexColors: true,
            linewidth,
            worldUnits: false,
            transparent: true,
            opacity,
            depthTest: true,
            depthWrite: false,
            blending,
            alphaToCoverage: true,
        });
        material.toneMapped = false;
        return material;
    }

    setActiveTract(tractId) {
        this.activeTract = tractId;
        this.applyTractFocus();
        this._updateVisibleCount();
        this._updateFunctionalOverlayEndpoints();
        this._needsRender = true;
    }

    applyTractFocus() {
        const selectedCategory = this.bundleDefinitions.findIndex(
            (bundle) => bundle.id === this.activeTract
        );
        for (const [categoryIndex, entry] of this.categoryMeshes.entries()) {
            const isOther = categoryIndex === this.otherCategory;
            let visible = true;
            if (selectedCategory >= 0) {
                visible = categoryIndex === selectedCategory;
            } else if (this.activeTract === 'overview') {
                visible = !isOther;
            }

            entry.core.visible = visible;
            entry.glow.visible = visible;
            if (!visible) continue;

            if (selectedCategory >= 0) {
                entry.core.material.opacity = 0.92;
                entry.glow.material.opacity = 0.16;
            } else {
                entry.core.material.opacity = this.activeTract === 'all' ? 0.54 : 0.64;
                entry.glow.material.opacity = this.activeTract === 'all' ? 0.06 : 0.1;
            }
        }
        this._updateFunctionalOverlayVisibility();
    }

    setFiberRadius(radius) {
        const nextRadius = Number(radius);
        if (!Number.isFinite(nextRadius) || nextRadius <= 0) {
            throw new Error('纤维线宽必须为正数');
        }
        this.fiberRadius = nextRadius;
        for (const entry of this.categoryMeshes.values()) {
            entry.core.material.linewidth = this.fiberRadius;
            entry.glow.material.linewidth = this.fiberRadius * 3.4;
        }
        this._needsRender = true;
    }

    async setFiberFilter({ minLength = this.minLength, decimationStride = this.decimationStride } = {}) {
        const nextMinLength = Number(minLength);
        const nextStride = Number(decimationStride);
        if (!Number.isFinite(nextMinLength) || nextMinLength < 0) {
            throw new Error('短流线阈值必须为非负数');
        }
        if (!Number.isInteger(nextStride) || nextStride < 1) {
            throw new Error('显示比例步长必须为正整数');
        }

        this.minLength = nextMinLength;
        this.decimationStride = nextStride;
        await this.rebuildFibers();
        const validation = this.validateFiberFilter();
        if (!validation.valid) {
            throw new Error(`纤维过滤状态校验失败：${validation.reason}`);
        }
        return this.getStats();
    }

    _isStreamlineInActiveTract(streamlineId) {
        const category = this.streamlineCategories?.[streamlineId] ?? -1;
        const selectedCategory = this.bundleDefinitions.findIndex(
            (bundle) => bundle.id === this.activeTract,
        );
        if (this.activeTract === 'all') return true;
        if (this.activeTract === 'overview') return category >= 0;
        return selectedCategory >= 0 && category === selectedCategory;
    }

    validateFiberFilter() {
        const rendered = this.renderedStreamlineIds || [];
        const visible = (this.visibleStreamlineIds || []).filter(
            (streamlineId) => this._isStreamlineInActiveTract(streamlineId),
        );
        const expected = [];
        const offsets = this.tractData?.offsets;
        for (let streamlineId = 0; streamlineId < (this.streamlineLengths?.length || 0); streamlineId++) {
            const hasSegment = offsets
                ? offsets[streamlineId + 1] - offsets[streamlineId] >= 2
                : true;
            if (
                streamlineId % this.decimationStride === 0
                && this.streamlineLengths[streamlineId] >= this.minLength
                && hasSegment
            ) {
                expected.push(streamlineId);
            }
        }

        const renderedCategoryCount = [...this.categoryMeshes.values()]
            .reduce((sum, entry) => sum + entry.streamlineCount, 0);
        const exactExpectedIds = expected.length === rendered.length
            && expected.every((streamlineId, index) => rendered[index] === streamlineId);
        const renderMode = this.validateFiberRenderMode();
        const valid = exactExpectedIds
            && renderedCategoryCount === rendered.length
            && visible.length === this.visibleStreamlines
            && renderMode.valid;

        return {
            valid,
            reason: valid
                ? ''
                : `期望 ${expected.length} 条、渲染 ${rendered.length} 条、分类计数 ${renderedCategoryCount} 条、当前可见 ${visible.length} 条、散点 ${renderMode.pointObjects} 个`,
            expectedStreamlines: expected.length,
            renderedStreamlines: rendered.length,
            visibleStreamlines: visible.length,
            threshold: this.minLength,
            renderMode,
        };
    }

    setGlassBrainVisible(visible) {
        this.glassVisible = !!visible;
        if (this.glassMesh) this.glassMesh.visible = this.glassVisible;
        this._needsRender = true;
    }

    setFunctionalNetwork(networkId, nodes, edges, color) {
        const old = this.networkMeshes.get(networkId);
        if (old) {
            this.networkRoot.remove(old.group);
            old.group.traverse((object) => {
                object.geometry?.dispose?.();
                object.material?.dispose?.();
            });
        }
        if (!nodes?.length) return;

        const group = new THREE.Group();
        group.name = `functional-network-${networkId}`;
        const nodeObjects = nodes.map((node, index) => {
            const geometry = new THREE.SphereGeometry(2.35, 18, 12);
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(color),
                emissive: new THREE.Color(color),
                emissiveIntensity: 0.16,
                roughness: 0.52,
                metalness: 0.02,
                transparent: true,
                opacity: 0.84,
                depthWrite: false,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(node[0], node[1], node[2]);
            mesh.renderOrder = 5;
            mesh.userData = { networkId, nodeIndex: index, kind: 'functional-endpoint' };
            group.add(mesh);
            return mesh;
        });

        const edgeObjects = (edges || []).map(([source, target]) => {
            if (!nodes[source] || !nodes[target]) return null;
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(...nodes[source]),
                new THREE.Vector3(...nodes[target]),
            ]);
            const material = new THREE.LineBasicMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: 0.24,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const line = new THREE.Line(geometry, material);
            line.renderOrder = 4;
            line.userData = { source, target, kind: 'functional-network-edge' };
            group.add(line);
            return line;
        }).filter(Boolean);

        group.visible = false;
        this.networkMeshes.set(networkId, {
            group,
            nodeObjects,
            edgeObjects,
            nodes: nodes.map((node) => node.slice()),
            edges: (edges || []).map(([source, target]) => [source, target]),
            endpointNodeIds: new Set(),
            endpointPairs: new Set(),
        });
        this.networkRoot.add(group);
        this._updateFunctionalOverlayEndpoints();
    }

    setFunctionalOverlay(networkId) {
        this.functionalOverlayId = networkId || null;
        this._updateFunctionalOverlayEndpoints();
        this._needsRender = true;
    }

    _nearestFunctionalNode(nodes, x, y, z) {
        let bestIndex = -1;
        let bestDistanceSquared = Infinity;
        for (let index = 0; index < nodes.length; index++) {
            const node = nodes[index];
            const dx = node[0] - x;
            const dy = node[1] - y;
            const dz = node[2] - z;
            const distanceSquared = dx * dx + dy * dy + dz * dz;
            if (distanceSquared < bestDistanceSquared) {
                bestDistanceSquared = distanceSquared;
                bestIndex = index;
            }
        }
        const radiusSquared = this.endpointSnapRadius * this.endpointSnapRadius;
        return bestDistanceSquared <= radiusSquared ? bestIndex : -1;
    }

    _updateFunctionalOverlayEndpoints() {
        const entry = this.functionalOverlayId
            ? this.networkMeshes.get(this.functionalOverlayId)
            : null;
        for (const networkEntry of this.networkMeshes.values()) {
            networkEntry.endpointNodeIds.clear();
            networkEntry.endpointPairs.clear();
        }
        if (!entry || !this.tractData) {
            this._updateFunctionalOverlayVisibility();
            return entry ? { nodeCount: 0, edgeCount: 0, pairCount: 0 } : null;
        }

        const points = this.tractData.points;
        const offsets = this.tractData.offsets;
        for (const streamlineId of this.renderedStreamlineIds) {
            if (!this._isStreamlineInActiveTract(streamlineId)) continue;
            const start = offsets[streamlineId];
            const end = offsets[streamlineId + 1];
            if (end - start < 2) continue;

            const source = this._nearestFunctionalNode(
                entry.nodes,
                points[start * 3],
                points[start * 3 + 1],
                points[start * 3 + 2],
            );
            const target = this._nearestFunctionalNode(
                entry.nodes,
                points[(end - 1) * 3],
                points[(end - 1) * 3 + 1],
                points[(end - 1) * 3 + 2],
            );
            if (source < 0 || target < 0) continue;
            entry.endpointNodeIds.add(source);
            entry.endpointNodeIds.add(target);
            entry.endpointPairs.add(`${source}:${target}`);
        }

        this._updateFunctionalOverlayVisibility();
        return this.getFunctionalOverlayStats();
    }

    _updateFunctionalOverlayVisibility() {
        this.networkRoot.visible = !!this.functionalOverlayId;
        for (const [networkId, entry] of this.networkMeshes.entries()) {
            const active = networkId === this.functionalOverlayId;
            entry.group.visible = active;
            entry.nodeObjects.forEach((mesh, index) => {
                mesh.visible = active && entry.endpointNodeIds.has(index);
            });
            entry.edgeObjects.forEach((line) => {
                const { source, target } = line.userData;
                line.visible = active
                    && entry.endpointNodeIds.has(source)
                    && entry.endpointNodeIds.has(target);
            });
        }
        this._needsRender = true;
    }

    getFunctionalOverlayStats() {
        const entry = this.functionalOverlayId
            ? this.networkMeshes.get(this.functionalOverlayId)
            : null;
        if (!entry) {
            return {
                enabled: false,
                networkId: null,
                nodeCount: 0,
                edgeCount: 0,
                pairCount: 0,
                endpointSnapRadius: this.endpointSnapRadius,
            };
        }
        return {
            enabled: true,
            networkId: this.functionalOverlayId,
            nodeCount: entry.endpointNodeIds.size,
            edgeCount: entry.edgeObjects.filter((line) => line.visible).length,
            pairCount: entry.endpointPairs.size,
            endpointSnapRadius: this.endpointSnapRadius,
        };
    }

    _updateVisibleCount() {
        this.visibleStreamlineIds = this.renderedStreamlineIds.filter(
            (streamlineId) => this._isStreamlineInActiveTract(streamlineId),
        );
        this.visibleStreamlines = this.visibleStreamlineIds.length;
    }

    getStats() {
        const categoryStreamlines = {};
        for (const [categoryIndex, entry] of this.categoryMeshes.entries()) {
            const id = categoryIndex === this.otherCategory
                ? 'other'
                : this.bundleDefinitions[categoryIndex]?.id;
            if (id) categoryStreamlines[id] = entry.streamlineCount;
        }
        const totalStreamlines = this.tractData
            ? Math.max(0, this.tractData.offsets.length - 1)
            : 0;
        return {
            totalStreamlines,
            renderedStreamlines: this.renderedStreamlineIds.length,
            visibleStreamlines: this.visibleStreamlines,
            hiddenByLength: (this.streamlineLengths || []).reduce(
                (count, length) => count + (length < this.minLength ? 1 : 0),
                0,
            ),
            minLength: this.minLength,
            decimationStride: this.decimationStride,
            categoryStreamlines,
            filterValidation: this.filterValidation || this.validateFiberFilter(),
        };
    }

    _startRenderLoop() {
        const animate = () => {
            if (this._disposed) return;
            this._animationFrame = requestAnimationFrame(animate);
            if (this.controls.update()) this._needsRender = true;
            if (this._needsRender) {
                this.renderer.render(this.scene, this.camera);
                this._needsRender = false;
            }
        };
        animate();
    }

    resize() {
        const width = Math.max(1, this.container.clientWidth);
        const height = Math.max(1, this.container.clientHeight);
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.resizeMaterials();
        this._needsRender = true;
    }

    resizeMaterials() {
        const width = Math.max(1, this.container.clientWidth);
        const height = Math.max(1, this.container.clientHeight);
        for (const entry of this.categoryMeshes.values()) {
            entry.core.material.resolution.set(width, height);
            entry.glow.material.resolution.set(width, height);
        }
    }

    computeModelCenter() {
        const bounds = new THREE.Box3();
        const points = this.tractData?.points;
        if (points?.length >= 3) {
            const point = new THREE.Vector3();
            for (let index = 0; index < points.length; index += 3) {
                point.set(points[index], points[index + 1], points[index + 2]);
                bounds.expandByPoint(point);
            }
        }

        const glassGeometry = this.glassMesh?.geometry;
        if (glassGeometry) {
            if (!glassGeometry.boundingBox) glassGeometry.computeBoundingBox();
            if (glassGeometry.boundingBox) bounds.union(glassGeometry.boundingBox);
        }

        return bounds.isEmpty()
            ? this.modelCenter.clone()
            : bounds.getCenter(new THREE.Vector3());
    }

    _updateCameraPivot() {
        const center = this.computeModelCenter();
        this.modelCenter.copy(center);
        if (!this.controls) return center;

        const currentOffset = this.camera.position.clone().sub(this.controls.target);
        const offset = currentOffset.lengthSq() > 0 ? currentOffset : this.defaultCameraOffset.clone();
        this.controls.target.copy(center);
        this.camera.position.copy(center).add(offset);
        this.controls.update();
        this._needsRender = true;
        return center;
    }

    getModelCenter() {
        return this.modelCenter.clone();
    }

    validateSpatialBinding() {
        return this.spatialRoot?.parent === this.scene
            && this.glassRoot?.parent === this.spatialRoot
            && this.fiberRoot?.parent === this.spatialRoot
            && this.networkRoot?.parent === this.spatialRoot;
    }

    resetView() {
        this._updateCameraPivot();
        this.camera.position.copy(this.modelCenter).add(this.defaultCameraOffset);
        this.controls.target.copy(this.modelCenter);
        this.controls.update();
        this._needsRender = true;
    }

    screenshot() {
        this._needsRender = true;
        this.renderer.render(this.scene, this.camera);
        return this.canvas.toDataURL('image/png');
    }

    dispose() {
        this._disposed = true;
        if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
        if (this._cameraPivotPointerHandler) {
            this.canvas?.removeEventListener('pointerdown', this._cameraPivotPointerHandler, { capture: true });
        }
        if (this._cameraPivotWheelHandler) {
            this.canvas?.removeEventListener('wheel', this._cameraPivotWheelHandler, { capture: true });
        }
        this.controls?.dispose();
        this.scene?.traverse((object) => {
            object.geometry?.dispose?.();
            if (Array.isArray(object.material)) {
                object.material.forEach((material) => material.dispose?.());
            } else {
                object.material?.dispose?.();
            }
        });
        this.renderer?.dispose();
        this.canvas?.remove();
    }
}

window.WhiteMatterThreeViewer = WhiteMatterThreeViewer;
