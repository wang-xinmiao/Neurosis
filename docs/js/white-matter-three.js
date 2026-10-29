import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LineSegments2 } from '../vendor/three/lines/LineSegments2.js';
import { LineSegmentsGeometry } from '../vendor/three/lines/LineSegmentsGeometry.js';
import { LineMaterial } from '../vendor/three/lines/LineMaterial.js';

const BLACK = 0x000000;
const GLASS_COLOR = new THREE.Color(0x8fc6e8);

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
        this.activeTract = 'overview';
        this.functionalOverlayId = null;
        this.categoryMeshes = new Map();
        this.networkMeshes = new Map();
        this.streamlineLengths = null;
        this.streamlineCategories = null;
        this.tractData = null;
        this.visibleStreamlines = 0;
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
        this._startRenderLoop();
        this.resize();
        return this;
    }

    async loadTractData(tractData, options = {}) {
        this.tractData = tractData;
        this._prepareStreamlineMetadata();
        await this.rebuildFibers();
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
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.055;
        this.controls.rotateSpeed = 0.58;
        this.controls.zoomSpeed = 0.78;
        this.controls.panSpeed = 0.62;
        this.controls.minDistance = 170;
        this.controls.maxDistance = 950;
        this.controls.addEventListener('change', () => {
            this._needsRender = true;
        });
        this.controls.update();

        this.fiberRoot = new THREE.Group();
        this.fiberRoot.name = 'fiber-tracts';
        this.scene.add(this.fiberRoot);

        this.networkRoot = new THREE.Group();
        this.networkRoot.name = 'functional-networks';
        this.scene.add(this.networkRoot);

        this.glassRoot = new THREE.Group();
        this.glassRoot.name = 'glass-brain';
        this.scene.add(this.glassRoot);
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

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: GLASS_COLOR },
                uOpacity: { value: 0.16 },
            },
            vertexShader: `
                varying vec3 vNormalView;
                varying vec3 vViewDirection;
                void main() {
                    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
                    vNormalView = normalize(normalMatrix * normal);
                    vViewDirection = normalize(-viewPosition.xyz);
                    gl_Position = projectionMatrix * viewPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uOpacity;
                varying vec3 vNormalView;
                varying vec3 vViewDirection;
                void main() {
                    float facing = abs(dot(normalize(vNormalView), normalize(vViewDirection)));
                    float fresnel = pow(1.0 - facing, 2.35);
                    float alpha = uOpacity * (0.04 + fresnel * 0.96);
                    vec3 color = uColor * (0.58 + fresnel * 0.72);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
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
        const { points, offsets } = this.tractData;
        const streamlineCount = offsets.length - 1;
        const segmentCounts = new Uint32Array(this.categoryCount + 1);
        const selectedIds = Array.from(
            { length: this.categoryCount + 1 },
            () => [],
        );

        for (let streamlineId = 0; streamlineId < streamlineCount; streamlineId++) {
            if (streamlineId % this.decimationStride !== 0) continue;
            if (this.streamlineLengths[streamlineId] < this.minLength) continue;
            if (offsets[streamlineId + 1] - offsets[streamlineId] < 2) continue;
            const category = this.streamlineCategories[streamlineId];
            const categoryIndex = category >= 0 ? category : this.otherCategory;
            selectedIds[categoryIndex].push(streamlineId);
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
        this.applyTractFocus();
        this.resizeMaterials();
        this._updateVisibleCount();
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
        this._needsRender = true;
    }

    applyTractFocus() {
        const selectedCategory = this.bundleDefinitions.findIndex(
            (bundle) => bundle.id === this.activeTract
        );
        const showOther = this.activeTract === 'all' || selectedCategory >= 0;
        for (const [categoryIndex, entry] of this.categoryMeshes.entries()) {
            const isOther = categoryIndex === this.otherCategory;
            if (isOther && !showOther) {
                entry.core.visible = false;
                entry.glow.visible = false;
                continue;
            }
            entry.core.visible = true;
            entry.glow.visible = true;
            if (selectedCategory >= 0) {
                const selected = categoryIndex === selectedCategory;
                entry.core.material.opacity = selected ? 0.92 : (isOther ? 0.025 : 0.075);
                entry.glow.material.opacity = selected ? 0.16 : (isOther ? 0.001 : 0.004);
            } else {
                entry.core.material.opacity = showOther ? 0.54 : 0.64;
                entry.glow.material.opacity = showOther ? 0.06 : 0.1;
            }
        }
        for (const [networkId, entry] of this.networkMeshes.entries()) {
            const visible = this.functionalOverlayId === networkId;
            entry.group.visible = visible;
        }
    }

    setFiberRadius(radius) {
        this.fiberRadius = Number(radius) || 1;
        for (const entry of this.categoryMeshes.values()) {
            entry.core.material.linewidth = this.fiberRadius;
            entry.glow.material.linewidth = this.fiberRadius * 3.4;
        }
        this._needsRender = true;
    }

    async setFiberFilter({ minLength = this.minLength, decimationStride = this.decimationStride } = {}) {
        this.minLength = Number(minLength);
        this.decimationStride = Math.max(1, Number(decimationStride) || 1);
        await new Promise((resolve) => setTimeout(resolve, 0));
        await this.rebuildFibers();
        return this.getStats();
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
        const positions = new Float32Array(nodes.length * 3);
        nodes.forEach((node, index) => {
            positions[index * 3] = node[0];
            positions[index * 3 + 1] = node[1];
            positions[index * 3 + 2] = node[2];
        });
        const pointGeometry = new THREE.BufferGeometry();
        pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pointMaterial = new THREE.PointsMaterial({
            color: new THREE.Color(color),
            size: 3.6,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.82,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const points = new THREE.Points(pointGeometry, pointMaterial);
        group.add(points);

        if (edges?.length) {
            const edgePositions = new Float32Array(edges.length * 6);
            edges.forEach(([source, target], index) => {
                edgePositions.set(nodes[source], index * 6);
                edgePositions.set(nodes[target], index * 6 + 3);
            });
            const edgeGeometry = new THREE.BufferGeometry();
            edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
            const edgeMaterial = new THREE.LineBasicMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: 0.22,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            group.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
        }
        group.visible = false;
        this.networkMeshes.set(networkId, { group });
        this.networkRoot.add(group);
    }

    setFunctionalOverlay(networkId) {
        this.functionalOverlayId = networkId || null;
        for (const [id, entry] of this.networkMeshes.entries()) {
            entry.group.visible = id === this.functionalOverlayId;
        }
        this._needsRender = true;
    }

    _updateVisibleCount() {
        let visible = 0;
        const selectedCategory = this.bundleDefinitions.findIndex(
            (bundle) => bundle.id === this.activeTract
        );
        for (const [categoryIndex, entry] of this.categoryMeshes.entries()) {
            const isOther = categoryIndex === this.otherCategory;
            if (isOther && this.activeTract !== 'all') continue;
            if (selectedCategory < 0 || categoryIndex === selectedCategory || isOther) {
                visible += entry.streamlineCount;
            }
        }
        this.visibleStreamlines = visible;
    }

    getStats() {
        const categoryStreamlines = {};
        for (const [categoryIndex, entry] of this.categoryMeshes.entries()) {
            const id = categoryIndex === this.otherCategory
                ? 'other'
                : this.bundleDefinitions[categoryIndex]?.id;
            if (id) categoryStreamlines[id] = entry.streamlineCount;
        }
        return {
            totalStreamlines: this.tractData
                ? Math.max(0, this.tractData.offsets.length - 1)
                : 0,
            visibleStreamlines: this.visibleStreamlines,
            minLength: this.minLength,
            decimationStride: this.decimationStride,
            categoryStreamlines,
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

    resetView() {
        this.camera.position.set(-360, -330, 145);
        this.controls.target.set(0, -12, 12);
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
