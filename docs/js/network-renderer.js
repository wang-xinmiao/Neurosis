/* =====================================================================
 * NeuroViz Three.js 球棒网络渲染层
 * ---------------------------------------------------------------------
 * 核心约束：
 * 1) 脑模型、节点、连线全部位于同一个 scene/root，共享同一相机矩阵；
 * 2) 连线使用 CylinderGeometry，不使用 WebGL Line，半径严格映射到
 *    [radiusMin, radiusMax] = [0.15, 1.2]；
 * 3) 节点使用不可见放大 SphereGeometry 作为 Raycaster 碰撞体；
 *    连线使用不可见加粗 CylinderGeometry 作为拾取体；
 * 4) OrbitControls 每帧 update()，旋转/缩放/平移同时作用于脑和网络。
 * ===================================================================== */
class BallStickNetworkRenderer {
    constructor(container, options = {}) {
        if (!window.THREE || !window.THREE.OrbitControls) {
            throw new Error('Three.js/OrbitControls 未加载');
        }
        this.container = container;
        this.options = Object.assign({
            radiusMin: 0.15,
            radiusMax: 1.2,
            nodeRadius: 1.9,
            collisionScale: 2.8,
            onSelect: () => {},
        }, options);

        this.scene = new THREE.Scene();
        this.root = new THREE.Group();
        this.scene.add(this.root);
        this.brainGroup = new THREE.Group();
        this.networkGroup = new THREE.Group();
        this.root.add(this.brainGroup, this.networkGroup);

        this.camera = new THREE.PerspectiveCamera(42, 1, 1, 4000);
        this.camera.position.set(0, 0, 315);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.domElement.className = 'network-three-canvas';
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.rotateSpeed = 0.85;
        this.controls.zoomSpeed = 0.85;
        this.controls.panSpeed = 0.75;
        this.controls.target.set(0, 0, 0);

        this.scene.add(new THREE.HemisphereLight(0xf4f7fb, 0x263241, 1.25));
        const key = new THREE.DirectionalLight(0xffffff, 1.05);
        key.position.set(180, 220, 260);
        const fill = new THREE.DirectionalLight(0xdbeafe, 0.55);
        fill.position.set(-220, -80, 180);
        this.scene.add(key, fill);

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.nodeObjects = [];
        this.edgeObjects = [];
        this.highlightObjects = [];
        this.pickObjects = [];
        this.brainObjects = [];
        this.brainCenter = new THREE.Vector3();
        this.brainRadius = 0;
        this.surfaceCentroids = new Map();
        this.selection = null;
        this.onlySelected = false;
        this.selectionLocked = false;
        this.focusNetwork = null;
        this.highlightRegionIds = new Set();
        this._dragStart = null;
        this._dragMoved = false;
        this._raf = null;

        const canvas = this.renderer.domElement;
        canvas.addEventListener('pointerdown', (event) => {
            this._dragStart = { x: event.clientX, y: event.clientY };
            this._dragMoved = false;
        });
        canvas.addEventListener('pointermove', (event) => {
            if (!this._dragStart) return;
            if (Math.hypot(event.clientX - this._dragStart.x, event.clientY - this._dragStart.y) > 4) {
                this._dragMoved = true;
            }
        });
        canvas.addEventListener('pointerup', (event) => {
            const moved = this._dragMoved;
            this._dragStart = null;
            this._dragMoved = false;
            if (!moved) this.pick(event);
        });

        this.resize();
        this._animate();
    }

    /** 将 NiiVue/MZ3 区域网格合并成单个灰白脑模型，不保留彩色分区网格。 */
    setBrainMeshes(meshes) {
        this.clearBrain();
        const positions = [];
        const indices = [];
        let vertexOffset = 0;
        (meshes || []).forEach((source) => {
            if (!source?.pts || !source?.tris || source.pts.length < 9) return;
            for (let i = 0; i < source.pts.length; i += 3) {
                // 统一到 Three 场景坐标，脑模型、节点、圆弧共用同一 root。
                positions.push(source.pts[i], source.pts[i + 2], -source.pts[i + 1]);
            }
            for (let i = 0; i < source.tris.length; i++) indices.push(source.tris[i] + vertexOffset);
            vertexOffset += source.pts.length / 3;
        });
        if (!positions.length) return;
        this.surfaceCentroids = new Map();
        (meshes || []).forEach((source) => {
            if (!source?.pts || source.regionId == null) return;
            let x = 0, y = 0, z = 0;
            const count = source.pts.length / 3;
            for (let i = 0; i < source.pts.length; i += 3) {
                x += source.pts[i];
                y += source.pts[i + 1];
                z += source.pts[i + 2];
            }
            this.surfaceCentroids.set(Number(source.regionId), [x / count, y / count, z / count]);
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        // 类 3D 打印树脂灰白材质：默认不透明，可由滑块单独调透明度。
        const material = new THREE.MeshStandardMaterial({
            color: 0xd9dee5,
            roughness: 0.78,
            metalness: 0.015,
            transparent: true,
            opacity: this.brainOpacity ?? 0.34,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = 0;
        mesh.userData = { kind: 'brain', pickable: false };
        this.brainGroup.add(mesh);
        this.brainObjects.push(mesh);

        const center = geometry.boundingBox.getCenter(new THREE.Vector3());
        geometry.computeBoundingSphere();
        this.brainCenter = center;
        this.brainRadius = (geometry.boundingSphere?.radius || 100) * 1.035;
        this.controls.target.copy(center);
        this.camera.position.set(center.x, center.y, center.z + 315);
        this.controls.update();
        this.applyBrainMaterial();
    }

    setBrainOpacity(opacity) {
        this.brainOpacity = Math.max(0.08, Math.min(1, Number(opacity) || 1));
        this.applyBrainMaterial();
    }

    applyBrainMaterial() {
        const opacity = this.brainOpacity ?? 0.34;
        this.brainObjects.forEach((mesh) => {
            const highlighted = this.highlightRegionIds.has(Number(mesh.userData.regionId));
            mesh.material.color.set(highlighted ? 0xffd166 : 0xd7dce2);
            mesh.material.emissive.set(highlighted ? 0x5b4300 : 0x000000);
            mesh.material.opacity = highlighted ? 1 : opacity;
            mesh.material.transparent = opacity < 1;
            mesh.material.needsUpdate = true;
        });
    }

    setRoiHighlight(regionIds) {
        this.highlightRegionIds = new Set((regionIds || []).map(Number));
        this.applyBrainMaterial();
    }

    setNetworkData(nodes, edges) {
        this.clearNetwork();
        const weights = edges.map((edge) => Math.abs(Number(edge.value) || 0)).filter(Number.isFinite);
        const minWeight = weights.length ? Math.min(...weights) : 0;
        const maxWeight = weights.length ? Math.max(...weights) : 1;
        const span = Math.max(1e-6, maxWeight - minWeight);

        nodes.forEach((node) => {
            const position = this.toScene(node.centroid, false);
            const radius = this.options.nodeRadius * (1 + Math.min(0.8, Math.sqrt(Math.max(0, node.degree || 0)) * 0.055));
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(node.color || '#94A3B8'),
                roughness: 0.62,
                metalness: 0.03,
                transparent: true,
                opacity: 1,
            });
            const visual = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 10), material);
            visual.position.copy(position);
            visual.renderOrder = 9;
            visual.userData = { kind: 'node', index: node.index, id: node.id, network: node.network };
            this.networkGroup.add(visual);
            this.nodeObjects.push(visual);

            // 不可见放大碰撞包围盒：只参与 Raycaster，不写颜色/深度。
            const collision = new THREE.Mesh(
                new THREE.SphereGeometry(radius * this.options.collisionScale, 12, 8),
                new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
            );
            collision.position.copy(position);
            collision.userData = visual.userData;
            this.networkGroup.add(collision);
            this.pickObjects.push(collision);
        });

        edges.forEach((edge) => {
            const source = nodes.find((node) => node.index === edge.source);
            const target = nodes.find((node) => node.index === edge.target);
            if (!source || !target) return;

            // 直线两端严格等于两个 ROI 表面质心，不添加控制点或外层路径点。
            const start = this.toScene(source.centroid, false);
            const end = this.toScene(target.centroid, false);
            const direction = new THREE.Vector3().subVectors(end, start);
            const length = direction.length();
            if (length < 0.01) return;

            const weight = Math.abs(Number(edge.value) || 0);
            // 核心线宽映射：权重最小值 -> radiusMin，最大值 -> radiusMax，线性插值。
            const radius = this.options.radiusMin + ((weight - minWeight) / span) * (this.options.radiusMax - this.options.radiusMin);
            const geometry = new THREE.CylinderGeometry(radius, radius, length, 10, 1, false);
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(edge.color || '#94A3B8'),
                roughness: 0.72,
                metalness: 0,
                transparent: true,
                opacity: Number.isFinite(edge.opacity) ? edge.opacity : 0.55,
            });
            const visual = new THREE.Mesh(geometry, material);
            visual.position.copy(start).add(end).multiplyScalar(0.5);
            visual.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
            visual.renderOrder = 10;
            visual.material.depthTest = false;
            visual.material.depthWrite = false;
            visual.userData = { kind: 'edge', edge, source: edge.source, target: edge.target, radius, type: edge.type || 'FC' };
            this.networkGroup.add(visual);
            this.edgeObjects.push(visual);

            // 选中连线细高亮描边：比原线稍粗，但保持克制。
            const highlightRadius = Math.min(1.35, Math.max(radius + 0.12, radius * 1.22));
            const highlightGeometry = new THREE.CylinderGeometry(highlightRadius, highlightRadius, length, 10, 1, false);
            const highlight = new THREE.Mesh(
                highlightGeometry,
                new THREE.MeshBasicMaterial({
                    color: 0xFACC15,
                    transparent: true,
                    opacity: 0.34,
                    depthTest: false,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                }),
            );
            highlight.position.copy(visual.position);
            highlight.quaternion.copy(visual.quaternion);
            highlight.visible = false;
            highlight.renderOrder = 12;
            highlight.userData = { kind: 'edgeHighlight', edge };
            this.networkGroup.add(highlight);
            this.highlightObjects.push(highlight);

            // 拾取圆柱比视觉圆柱粗，保证细线容易点击；不参与颜色渲染。
            const pickRadius = Math.max(2.0, radius * 3.0);
            const pick = new THREE.Mesh(
                new THREE.CylinderGeometry(pickRadius, pickRadius, length, 8, 1, false),
                new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
            );
            pick.position.copy(visual.position);
            pick.quaternion.copy(visual.quaternion);
            pick.userData = { ...visual.userData, visualMesh: visual };
            this.networkGroup.add(pick);
            this.pickObjects.push(pick);
        });

        this.applyVisibility();
    }

    toScene(centroid = [0, 0, 0], projectOutside = true) {
        const point = new THREE.Vector3(
            Number(centroid[0]) || 0,
            Number(centroid[2]) || 0,
            -Number(centroid[1]) || 0,
        );
        return point;
    }

    /** Raycaster 拾取：细圆柱/放大碰撞体容错，节点明显更近时才优先节点。 */
    setPickingLocked(locked) {
        this.selectionLocked = !!locked;
    }

    pick(event) {
        if (this.selectionLocked) return;
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObjects(this.pickObjects, true)
            .filter((hit) => hit.object.userData?.kind);
        const nodeHit = hits.find((hit) => hit.object.userData.kind === 'node');
        const edgeHit = hits.find((hit) => hit.object.userData.kind === 'edge');
        const hit = edgeHit && (!nodeHit || edgeHit.distance <= nodeHit.distance + 10) ? edgeHit : (nodeHit || edgeHit);
        if (hit) this.options.onSelect(hit.object.userData);
    }

    clearHighlight() {
        this.highlightObjects.forEach((mesh) => { mesh.visible = false; });
    }

    setSelection(selection) {
        this.clearHighlight();
        this.selection = selection ? { ...selection, kind: selection.kind || selection.type } : null;
        this.applyVisibility();
    }

    setOnlySelected(enabled) {
        this.onlySelected = !!enabled;
        if (!enabled) this.clearHighlight();
        this.applyVisibility();
        this.applyBrainMaterial();
    }

    setFocusNetwork(networkId) {
        this.focusNetwork = networkId || null;
        this.applyVisibility();
    }

    /** Yeo7/Yeo17 切换时只更新颜色/状态，不重建几何体或上传新的GPU顶点缓冲。 */
    updateNetworkStyles(nodes, edges) {
        const nodeMap = new Map(nodes.map((node) => [node.index, node]));
        this.nodeObjects.forEach((mesh) => {
            const node = nodeMap.get(mesh.userData.index);
            if (!node) return;
            mesh.material.color.set(node.color || '#94A3B8');
            mesh.userData.network = node.network;
        });
        const edgeMap = new Map(edges.map((edge) => [`${edge.source}:${edge.target}`, edge]));
        this.edgeObjects.forEach((mesh) => {
            const edge = edgeMap.get(`${mesh.userData.source}:${mesh.userData.target}`);
            if (!edge) return;
            mesh.material.color.set(edge.color || '#94A3B8');
            mesh.material.opacity = Number.isFinite(edge.opacity) ? edge.opacity : 0.55;
            mesh.userData.edge = edge;
            mesh.userData.network = edge.network;
        });
        this.highlightObjects.forEach((mesh) => {
            const edge = edgeMap.get(`${mesh.userData.edge?.source}:${mesh.userData.edge?.target}`);
            if (edge) mesh.userData.edge = edge;
        });
        this.applyVisibility();
    }

    applyVisibility() {
        this.nodeObjects.forEach((mesh) => {
            const index = mesh.userData.index;
            mesh.visible = this.isNodeVisible(index);
            mesh.material.opacity = this.isNodeHighlighted(index) ? 1 : (this.isFocused(mesh.userData.network) ? 0.96 : 0.16);
        });
        this.edgeObjects.forEach((mesh) => {
            const edge = mesh.userData.edge;
            mesh.visible = this.isEdgeVisible(edge);
            const highlighted = this.isEdgeHighlighted(edge);
            const focused = this.isFocused(edge.sourceNetwork) || this.isFocused(edge.targetNetwork);
            mesh.material.opacity = highlighted ? 1 : (focused ? 0.68 : 0.1);
        });
        this.highlightObjects.forEach((mesh) => {
            const edge = mesh.userData.edge;
            const edgeSelected = this.selection?.kind === 'edge'
                && this.selection.source === edge.source && this.selection.target === edge.target;
            const nodeSelected = this.selection?.kind === 'node'
                && (edge.source === this.selection.index || edge.target === this.selection.index);
            mesh.visible = this.isEdgeVisible(edge) && (edgeSelected || nodeSelected);
        });
    }

    isNodeVisible(index) {
        if (!this.onlySelected) return true;
        if (this.selection?.kind === 'node') return this.selection.index === index;
        if (this.selection?.kind === 'edge') return index === this.selection.source || index === this.selection.target;
        return true;
    }

    isEdgeVisible(edge) {
        if (!this.onlySelected) return true;
        return this.selection?.kind === 'edge' && edge.source === this.selection.source && edge.target === this.selection.target;
    }

    isNodeHighlighted(index) {
        if (this.selection?.kind === 'node') return this.selection.index === index;
        if (this.selection?.kind === 'edge') return index === this.selection.source || index === this.selection.target;
        return true;
    }

    isEdgeHighlighted(edge) {
        if (this.selection?.kind === 'node') return edge.source === this.selection.index || edge.target === this.selection.index;
        return true;
    }

    isFocused(network) {
        return !this.focusNetwork || this.focusNetwork === network;
    }

    clearNetwork() {
        [...this.nodeObjects, ...this.edgeObjects, ...this.pickObjects].forEach((mesh) => {
            mesh.geometry?.dispose();
            mesh.material?.dispose();
            this.networkGroup.remove(mesh);
        });
        this.nodeObjects = [];
        this.edgeObjects = [];
        this.highlightObjects = [];
        this.pickObjects = [];
    }

    clearBrain() {
        this.brainObjects.forEach((mesh) => {
            mesh.geometry?.dispose();
            mesh.material?.dispose();
            this.brainGroup.remove(mesh);
        });
        this.brainObjects = [];
        this.brainCenter = new THREE.Vector3();
        this.brainRadius = 0;
        this.surfaceCentroids = new Map();
    }

    resize() {
        const width = this.container.clientWidth || 900;
        const height = this.container.clientHeight || 650;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    _animate() {
        this._raf = requestAnimationFrame(() => this._animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        cancelAnimationFrame(this._raf);
        this.clearNetwork();
        this.clearBrain();
        this.controls.dispose();
        this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}

window.BallStickNetworkRenderer = BallStickNetworkRenderer;
