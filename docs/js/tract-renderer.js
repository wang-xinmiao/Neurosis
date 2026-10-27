/* =====================================================================
 * NeuroViz 白质纤维轻量化渲染层
 * - 兼容 .tck / .trk（通过 NiiVue NVMeshLoaders 解析）
 * - downsampleStreamlines() 控制浏览器顶点数量
 * - 支持方向 RGB / FA 两种着色
 * ===================================================================== */
class TractRenderer {
    constructor(container) {
        if (!window.THREE) throw new Error('Three.js 未加载');
        this.container = container;
        this.scene = new THREE.Scene();
        this.root = new THREE.Group();
        this.scene.add(this.root);
        this.camera = new THREE.PerspectiveCamera(45, 1, 1, 3000);
        this.camera.position.set(0, 0, 320);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
        this.renderer.setClearColor(0x07111f, 1);
        this.renderer.domElement.className = 'tract-three-canvas';
        container.appendChild(this.renderer.domElement);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x263241, 1.2));
        this.tractGroups = new Map();
        this.brainGroup = new THREE.Group();
        this.root.add(this.brainGroup);
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Line = { threshold: 3.5 };
        this.onSelect = null;
        this.renderer.domElement.addEventListener('click', (event) => this.pick(event));
        this.resize();
        this._animate();
    }

    /** 纤维轻量化：按固定 stride 抽稀，保留端点，避免浏览器顶点过多。 */
    downsampleStreamlines(streamlines, maxPointsPerStreamline = 120, maxStreamlines = 3500) {
        const result = [];
        const streamCount = Math.min(streamlines.length, maxStreamlines);
        for (let s = 0; s < streamCount; s++) {
            const line = streamlines[s];
            const stride = Math.max(1, Math.ceil(line.length / 3 / maxPointsPerStreamline));
            const points = [];
            for (let i = 0; i < line.length; i += 3 * stride) points.push(line[i], line[i + 1], line[i + 2]);
            const end = line.length - 3;
            if (end >= 0 && (points.length < 3 || points[points.length - 3] !== line[end])) points.push(line[end], line[end + 1], line[end + 2]);
            if (points.length >= 6) result.push(points);
        }
        return result;
    }

    addTract(id, streamlines, faValues = []) {
        const lines = this.downsampleStreamlines(streamlines);
        const positions = [], colors = [], lineRanges = [];
        lines.forEach((line, index) => {
            const start = positions.length / 3;
            for (let i = 0; i < line.length; i += 3) {
                positions.push(line[i], line[i + 1], line[i + 2]);
                const fa = faValues[index] ?? 0.45;
                colors.push(fa, fa, fa);
            }
            lineRanges.push({ start, end: positions.length / 3, fa: faValues[index] ?? 0.45 });
        });
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.72 });
        const object = new THREE.LineSegments(geometry, material);
        object.userData = { kind: 'tract', id, lineRanges };
        this.root.add(object);
        this.tractGroups.set(id, object);
        this.setColorMode('fa');
        return object;
    }

    setColorMode(mode) {
        this.colorMode = mode;
        this.tractGroups.forEach((object) => {
            const pos = object.geometry.attributes.position.array;
            const colors = object.geometry.attributes.color.array;
            for (let i = 0, vertex = 0; i < pos.length; i += 3, vertex++) {
                if (mode === 'direction') {
                    const next = Math.min(pos.length - 3, i + 3);
                    const dx = pos[next] - pos[i], dy = pos[next + 1] - pos[i + 1], dz = pos[next + 2] - pos[i + 2];
                    const length = Math.hypot(dx, dy, dz) || 1;
                    colors[i] = Math.abs(dx) / length;
                    colors[i + 1] = Math.abs(dy) / length;
                    colors[i + 2] = Math.abs(dz) / length;
                } else {
                    const fa = object.userData.lineRanges?.find((range) => vertex >= range.start && vertex < range.end)?.fa ?? 0.45;
                    colors[i] = fa;
                    colors[i + 1] = fa;
                    colors[i + 2] = fa;
                }
            }
            object.geometry.attributes.color.needsUpdate = true;
        });
    }

    generateDemoTracts() {
        const definitions = {
            arcuate: [[-58, -32, 18], [-42, -8, 34], [-52, 22, 18], [-58, 42, 4]],
            cingulum: [[-12, -42, 8], [-8, -12, 30], [0, 18, 32], [8, 42, 12]],
            cst: [[-28, -22, 58], [-18, -18, 24], [-10, -18, -10], [-8, -18, -42]],
            slf: [[-52, -34, 28], [-34, -18, 46], [-18, 18, 42], [-4, 42, 28]],
            ilf: [[-42, -72, 2], [-38, -48, 10], [-34, -18, 4], [-30, 12, -8]],
            uncinate: [[-42, -22, -14], [-34, 2, -18], [-24, 24, -12], [-18, 38, -2]],
            corpus: [[-42, -12, 18], [-18, -2, 28], [0, 2, 32], [20, -2, 28], [42, -12, 18]],
        };
        Object.entries(definitions).forEach(([id, points], index) => {
            const line = [];
            for (let i = 1; i < points.length; i++) {
                const a = points[i - 1], b = points[i];
                for (let t = 0; t < 20; t++) {
                    const u = t / 20;
                    line.push(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
                }
            }
            line.push(...points[points.length - 1]);
            this.addTract(id, [line], [0.34 + index * 0.045]);
        });
    }

    setTractVisibility(id, visible) {
        if (id === null) {
            this.tractGroups.forEach((object) => { object.visible = visible; });
            return;
        }
        const object = this.tractGroups.get(id);
        if (object) object.visible = visible;
    }

    addNetworkOverlay() {}
    removeOverlay() {}
    resetView() {
        this.camera.position.set(0, 0, 320);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    async loadFile(file) {
        const buffer = await file.arrayBuffer();
        const parsed = /\\.tck$/i.test(file.name)
            ? niivue.NVMeshLoaders.readTCK(buffer)
            : niivue.NVMeshLoaders.readTRK(buffer);
        const streamlines = this.offsetsToStreamlines(parsed.pts, parsed.offsetPt0);
        const fa = parsed.dpv?.find((item) => /fa/i.test(item.id))?.vals || [];
        this.addTract(file.name, streamlines, Array.from(fa));
    }

    offsetsToStreamlines(points, offsets) {
        const lines = [];
        for (let i = 1; i < offsets.length; i++) {
            const start = offsets[i - 1], end = offsets[i];
            if (end > start) lines.push(Array.from(points.slice(start * 3, end * 3)));
        }
        return lines;
    }

    setBrainMeshes(meshes) {
        this.brainGroup.clear();
        (meshes || []).forEach((source) => {
            if (!source?.pts || !source?.tris) return;
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(source.pts, 3));
            geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(source.tris), 1));
            geometry.computeVertexNormals();
            this.brainGroup.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xd7dce2, transparent: true, opacity: 0.52, roughness: 0.8 })));
        });
    }

    pick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        this.raycaster.setFromCamera(pointer, this.camera);
        const hits = this.raycaster.intersectObjects([...this.tractGroups.values()], true);
        if (hits[0] && this.onSelect) this.onSelect(hits[0].object.userData);
    }

    resize() {
        const width = this.container.clientWidth || 800, height = this.container.clientHeight || 600;
        this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
window.TractRenderer = TractRenderer;
