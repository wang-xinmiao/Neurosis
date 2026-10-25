/* =====================================================================
 * NeuroViz 功能网络模块
 * ---------------------------------------------------------------------
 * 当前仓库没有真实 fMRI 时间序列、统计参数图或实测功能连接矩阵。
 * 因此本模块使用固定种子的演示连接/激活数据，保证 68/116/148/360
 * 四类图谱均可交互预览。接入真实数据时，只需替换 loadAtlas() 返回的
 * matrix 与 activation 值，视图组件无需重写。
 * ===================================================================== */

const FUNCTIONAL_ATLASES = {
    hcp360: {
        label: 'HCP MMP 1.0（360分区）',
        nominalRegions: 360,
        url: './data/atlas_hcp360.json?v=79',
    },
    dk68: {
        label: 'Desikan-Killiany（68分区）',
        nominalRegions: 68,
        url: './data/atlas_dk68.json?v=79',
    },
    aal116: {
        label: 'AAL（116分区）',
        nominalRegions: 116,
        url: './data/atlas_aal116.json?v=79',
    },
    destrieux148: {
        label: 'Destrieux（148分区）',
        nominalRegions: 148,
        url: './data/atlas_destrieux148.json?v=79',
    },
};

const FUNCTIONAL_NETWORKS = {
    dmn: {
        label: '默认模式网络 DMN',
        short: 'DMN',
        color: '#2563EB',
        description: '默认模式网络主要参与自传体记忆、情景记忆、内部思考和社会认知，在任务暂停或走神时仍保持较高的协同活动。',
    },
    attention: {
        label: '注意网络',
        short: '注意',
        color: '#10B981',
        description: '注意网络负责将认知资源导向当前重要信息，参与视觉空间定向、目标检测和持续注意。',
    },
    ecn: {
        label: '执行控制网络 ECN',
        short: 'ECN',
        color: '#EF4444',
        description: '执行控制网络参与工作记忆、规则维护、冲突监控、计划和灵活决策，是高级认知控制的核心网络。',
    },
    smn: {
        label: '感觉运动网络 SMN',
        short: 'SMN',
        color: '#8B5CF6',
        description: '感觉运动网络涵盖初级运动皮层、躯体感觉皮层及相关辅助区域，参与动作计划、执行和身体感觉处理。',
    },
};

class MniSliceViewer {
    constructor(container, orientation, network, onReady) {
        this.container = container;
        this.orientation = orientation;
        this.network = network;
        this.onReady = onReady || (() => {});
        this.threshold = 3;
        this.ready = false;

        const settings = {
            axial: { sliceType: niivue.SLICE_TYPE.AXIAL, axis: 2, min: -72, max: 106, value: 12, label: 'Z 轴' },
            sagittal: { sliceType: niivue.SLICE_TYPE.SAGITTAL, axis: 0, min: -98, max: 98, value: 0, label: 'X 轴' },
            coronal: { sliceType: niivue.SLICE_TYPE.CORONAL, axis: 1, min: -134, max: 98, value: -8, label: 'Y 轴' },
        }[orientation];
        this.settings = settings;

        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('role', 'img');
        this.canvas.setAttribute('aria-label', `${orientation} MNI脑模板与统计参数图叠加`);
        container.appendChild(this.canvas);

        const control = document.createElement('label');
        control.className = 'activation-slice-control';
        control.innerHTML = `<span>${settings.label}</span><input type="range" min="${settings.min}" max="${settings.max}" step="1" value="${settings.value}"><output>${settings.value} mm</output>`;
        this.slider = control.querySelector('input');
        this.output = control.querySelector('output');
        container.appendChild(control);

        const caption = document.createElement('figcaption');
        caption.textContent = {
            axial: '轴位 Axial',
            sagittal: '矢状位 Sagittal',
            coronal: '冠状位 Coronal',
        }[orientation];
        container.appendChild(caption);

        this.nv = new niivue.Niivue({
            sliceType: settings.sliceType,
            show3Dcrosshair: false,
            crosshairColor: [0, 220, 255, 255],
            isAxialCrosshairVisible: false,
            isOrientationTextVisible: true,
            isCornerOrientationText: true,
            backColor: [0, 0, 0, 1],
            textHeight: 0.035,
        });
        this.nv.attachToCanvas(this.canvas, true);

        this.slider.addEventListener('input', () => {
            const value = Number(this.slider.value);
            this.output.textContent = `${value} mm`;
            this.setSlicePosition(value);
        });

        this.loadVolumes(network);
    }

    async loadVolumes(network) {
        this.network = network;
        try {
            await this.nv.loadVolumes([
                {
                    url: './data/MNI152_T1w_1mm.nii.gz?v=81',
                    name: 'MNI152_T1w_1mm.nii.gz',
                    colormap: 'gray',
                    opacity: 1.0,
                    ignoreZeroVoxels: false,
                },
                {
                    url: `./data/demo_zstat_${network}.nii.gz?v=81`,
                    name: `demo_zstat_${network}.nii.gz`,
                    colormap: 'warm',
                    colormapNegative: 'winter',
                    opacity: 0.72,
                    ignoreZeroVoxels: true,
                    cal_min: this.threshold,
                    cal_max: 8,
                },
            ]);
            const overlay = this.nv.volumes[1];
            if (overlay) {
                overlay.useNegativeCmap = true;
                overlay.cal_min = this.threshold;
                overlay.cal_max = 8;
                overlay.cal_minNeg = this.threshold;
                overlay.cal_maxNeg = 8;
                overlay.opacity = 0.72;
            }
            this.ready = true;
            this.setSlicePosition(Number(this.slider.value));
            this.onReady(this);
        } catch (error) {
            console.error('[MniSliceViewer] 切片加载失败:', error);
        }
    }

    setSlicePosition(value) {
        if (!this.ready) return;
        const mm = [0, 0, 0];
        mm[this.settings.axis] = Number(value);
        try {
            const frac = this.nv.mm2frac(mm);
            this.nv.scene.crosshairPos = frac;
            this.nv.createOnLocationChange();
            this.nv.drawScene();
        } catch (error) {
            console.warn('[MniSliceViewer] 设置切片位置失败:', error);
        }
    }

    setThreshold(threshold) {
        this.threshold = Number(threshold);
        const overlay = this.nv.volumes[1];
        if (!overlay) return;
        overlay.cal_min = this.threshold;
        overlay.cal_max = 8;
        overlay.cal_minNeg = this.threshold;
        overlay.cal_maxNeg = 8;
        overlay.ignoreZeroVoxels = true;
        try { this.nv.updateGLVolume(); } catch (error) { /* ignore */ }
    }

    dispose() {
        try { this.nv.volumes.slice().forEach((volume) => this.nv.removeVolume(volume)); } catch (e) { /* ignore */ }
        this.canvas.remove();
    }
}

class FunctionalNetworkManager {
    constructor(options = {}) {
        this.onToast = options.onToast || (() => {});
        this.currentAtlas = 'hcp360';
        this.currentView = 'topology';
        this.activeNetworks = new Set(Object.keys(FUNCTIONAL_NETWORKS));
        this.activationNetwork = 'smn';
        this.data = null;
        this.charts = {};
        this.brainViewers = {};
        this.sliceViewers = [];
        this.topologySelection = null;
        this.heatmapPair = null;
        this._resizeTimer = null;
        this._overlayFrame = null;
    }

    async init() {
        this.bindTabs();
        this.bindControls();
        await this.loadAtlas(this.currentAtlas);
    }

    bindTabs() {
        document.querySelectorAll('#funcTabs .func-tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                this.currentView = tab.dataset.view;
                document.querySelectorAll('#funcTabs .func-tab').forEach((item) => {
                    item.classList.toggle('active', item === tab);
                });
                document.querySelectorAll('#module2 .func-view').forEach((panel) => {
                    panel.classList.toggle('active', panel.id === `view-${this.currentView}`);
                });
                requestAnimationFrame(() => this.renderCurrentView());
            });
        });
    }

    bindControls() {
        const atlasSelect = document.getElementById('funcAtlasSelect');
        if (atlasSelect) {
            atlasSelect.addEventListener('change', async () => {
                await this.loadAtlas(atlasSelect.value);
            });
        }

        document.querySelectorAll('#networkCheckboxBar input[data-network]').forEach((checkbox) => {
            checkbox.addEventListener('change', () => {
                const network = checkbox.dataset.network;
                if (checkbox.checked) this.activeNetworks.add(network);
                else this.activeNetworks.delete(network);
                if (this.activeNetworks.size === 0) {
                    checkbox.checked = true;
                    this.activeNetworks.add(network);
                    this.onToast('至少保留一个功能网络', 'info');
                }
                this.topologySelection = null;
                this.heatmapPair = null;
                if (this.currentView === 'topology') this.renderTopology();
                if (this.currentView === 'heatmap') this.renderHeatmap();
                if (this.currentView === 'chord') this.renderChord();
                this.updateExplanation();
            });
        });

        const threshold = document.getElementById('topologyThreshold');
        if (threshold) {
            threshold.addEventListener('input', () => {
                this.updateControlLabels();
                if (this.currentView === 'topology') this.renderTopology();
            });
        }

        const chordThreshold = document.getElementById('chordThreshold');
        if (chordThreshold) {
            chordThreshold.addEventListener('input', () => {
                this.updateControlLabels();
                if (this.currentView === 'chord') this.renderChord();
            });
        }

        const activationThreshold = document.getElementById('activationThreshold');
        if (activationThreshold) {
            activationThreshold.addEventListener('input', () => {
                this.updateControlLabels();
                this.sliceViewers.forEach((viewer) => viewer.setThreshold(activationThreshold.value));
                this.updateExplanation();
            });
        }

        const activationNetwork = document.getElementById('activationNetworkSelect');
        if (activationNetwork) {
            activationNetwork.addEventListener('change', async () => {
                this.activationNetwork = activationNetwork.value;
                await this.buildActivationCanvasLayout();
                this.updateExplanation();
            });
        }

        const viewPair = document.getElementById('btnViewPairInTopology');
        if (viewPair) {
            viewPair.addEventListener('click', () => {
                if (!this.heatmapPair) return;
                this.topologySelection = {
                    type: 'edge',
                    source: this.heatmapPair.source,
                    target: this.heatmapPair.target,
                    value: this.data.matrix[this.heatmapPair.source][this.heatmapPair.target],
                };
                [this.heatmapPair.source, this.heatmapPair.target].forEach((index) => {
                    const network = this.data.regions[index].network;
                    this.activeNetworks.add(network);
                    const checkbox = document.querySelector(`#networkCheckboxBar input[data-network="${network}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                document.querySelector('#funcTabs [data-view="topology"]')?.click();
            });
        }

        const reset = document.getElementById('btnResetFunctional');
        if (reset) {
            reset.addEventListener('click', () => {
                this.disposeCharts();
                this.destroyBrainViewers();
                this.disposeSliceViewers();
                this.activeNetworks = new Set(Object.keys(FUNCTIONAL_NETWORKS));
                document.querySelectorAll('#networkCheckboxBar input[data-network]').forEach((item) => {
                    item.checked = true;
                });
                this.topologySelection = null;
                this.heatmapPair = null;
                this.renderCurrentView();
                this.onToast('功能网络视图已重置', 'info');
            });
        }

        window.addEventListener('resize', () => {
            clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(() => this.resizeAll(), 120);
        });
    }

    updateControlLabels() {
        const labels = {
            topologyThresholdValue: `${(Number(document.getElementById('topologyThreshold')?.value || 42) / 100).toFixed(2)}`,
            chordThresholdValue: `${(Number(document.getElementById('chordThreshold')?.value || 52) / 100).toFixed(2)}`,
            activationThresholdValue: `Z ≥ ${Number(document.getElementById('activationThreshold')?.value || 3).toFixed(1)}`,
        };
        Object.entries(labels).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = text;
        });
    }

    async loadAtlas(atlasId) {
        const config = FUNCTIONAL_ATLASES[atlasId] || FUNCTIONAL_ATLASES.hcp360;
        this.currentAtlas = FUNCTIONAL_ATLASES[atlasId] ? atlasId : 'hcp360';
        const status = document.getElementById('functionalDataStatus');
        if (status) status.textContent = `正在加载 ${config.label} …`;

        try {
            const response = await fetch(config.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const raw = await response.json();
            const regions = (raw.regions || []).map((region, index) => this.normalizeRegion(region, index));
            this.data = {
                atlasId: this.currentAtlas,
                label: config.label,
                nominalRegions: config.nominalRegions,
                regions,
                matrix: this.generateCorrelationMatrix(regions),
                activation: this.generateActivation(regions),
            };

            if (status) {
                status.textContent = `${config.label} · ${regions.length}/${config.nominalRegions} 个可用 ROI · 演示连接数据`;
                status.classList.toggle('incomplete', regions.length !== config.nominalRegions);
            }
            this.disposeCharts();
            this.destroyBrainViewers();
            this.topologySelection = null;
            this.heatmapPair = null;
            this.updateControlLabels();
            this.renderCurrentView();
            this.updateExplanation();
        } catch (error) {
            console.error('[FunctionalNetwork] 图谱数据加载失败:', error);
            if (status) {
                status.textContent = `${config.label} 加载失败：${error.message}`;
                status.classList.add('incomplete');
            }
            this.onToast('功能网络图谱数据加载失败', 'error');
        }
    }

    normalizeRegion(region, index) {
        const rgb = Array.isArray(region.color) ? region.color : [100, 116, 139];
        const color = '#' + rgb.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('');
        const code = region.name_en || String(region.id || index);
        return {
            index,
            id: Number(region.id || index + 1),
            name: region.name_zh || code,
            code,
            color,
            centroid: Array.isArray(region.centroid_mm) ? region.centroid_mm.map(Number) : [0, 0, 0],
            system: this.inferSystem(region),
            network: this.inferNetwork(region, index),
        };
    }

    inferSystem(region) {
        const text = `${region.name_zh || ''} ${region.name_en || ''}`.toLowerCase();
        if (/小脑|cerebell|vermis|dentate|丘脑|海马|杏仁|尾状|壳核|苍白|thalam|hippoc|amygd|caudate|putamen|pallid/.test(text)) return 'subcortical';
        if (/视|距状|楔叶|枕|visual|occip|cuneus|calcar|v1|v2|v3|v4|mt|mst/.test(text)) return 'visual';
        if (/中央前|中央后|运动|感觉|precentral|postcentral|paracentral|somatosensory|motor|4_roi|3b_roi/.test(text)) return 'somatomotor';
        if (/额眼|顶内|注意|frontal_eye|fef|ips|attention|superior_parietal|上顶/.test(text)) return 'dorsal';
        if (/岛叶|岛盖|扣带|额下|颞顶|insula|opercul|cingulate|salience|temporoparietal|ifg/.test(text)) return 'salience';
        if (/海马旁|杏仁|眶额|颞极|边缘|parahippoc|entorhinal|temporalpole|olfact|limbic|ofc/.test(text)) return 'limbic';
        if (/额中|额上|顶下|角回|缘上|frontoparietal|middle_frontal|superior_frontal|inferior_parietal|supramarginal|angular/.test(text)) return 'frontoparietal';
        if (/楔前|后扣带|内侧前额|默认|precuneus|posterior_cingulate|medial_prefrontal|default|temporal_parietal/.test(text)) return 'default';
        return 'other';
    }

    inferNetwork(region, index) {
        const text = `${region.name_zh || ''} ${region.name_en || ''}`.toLowerCase();
        if (/中央前|中央后|旁中央|运动|感觉|precentral|postcentral|paracentral|motor|somatosensory|4_roi|3b_roi|s1|s2/.test(text)) return 'smn';
        if (/楔前|后扣带|压后|海马|海马旁|内嗅|内侧前额|默认|记忆|precuneus|posterior_cingulate|retrosplenial|hippoc|parahippoc|entorhinal|medial_prefrontal|default/.test(text)) return 'dmn';
        if (/注意|额眼|顶内|视觉|视|距状|楔叶|枕|fef|ips|attention|visual|occip|cuneus|calcar|v1|v2|v3|v4|mt|mst/.test(text)) return 'attention';
        if (/执行|控制|工作记忆|额下|额中|额上|顶下|角回|缘上|语言|executive|control|working|ifg|middle_frontal|superior_frontal|inferior_parietal|angular|supramarginal/.test(text)) return 'ecn';

        const systemNetwork = {
            somatomotor: 'smn',
            default: 'dmn',
            limbic: 'dmn',
            dorsal: 'attention',
            visual: 'attention',
            salience: 'attention',
            frontoparietal: 'ecn',
            subcortical: index % 2 === 0 ? 'dmn' : 'ecn',
            other: index % 3 === 0 ? 'attention' : 'ecn',
        }[this.inferSystem(region)];
        return systemNetwork || Object.keys(FUNCTIONAL_NETWORKS)[index % 4];
    }

    generateCorrelationMatrix(regions) {
        const count = regions.length;
        const matrix = Array.from({ length: count }, () => new Float32Array(count));
        for (let i = 0; i < count; i++) {
            matrix[i][i] = 1;
            for (let j = i + 1; j < count; j++) {
                const a = regions[i];
                const b = regions[j];
                const distance = Math.hypot(
                    a.centroid[0] - b.centroid[0],
                    a.centroid[1] - b.centroid[1],
                    a.centroid[2] - b.centroid[2],
                );
                const sameSystem = a.system === b.system ? 1 : 0;
                const sameHemi = Math.sign(a.centroid[0]) === Math.sign(b.centroid[0]) ? 1 : 0;
                const distanceTerm = 0.67 * Math.exp(-distance / 42);
                const networkTerm = sameSystem * 0.24 + sameHemi * 0.055;
                const noise = (this.hash01(i + 7, j + 11) - 0.5) * 0.34;
                const negativeBias = a.system === 'default' && b.system === 'somatomotor' ? -0.14 : 0;
                const value = Math.max(-0.92, Math.min(0.96, distanceTerm + networkTerm + noise - 0.17 + negativeBias));
                matrix[i][j] = value;
                matrix[j][i] = value;
            }
        }
        return matrix;
    }

    generateActivation(regions) {
        const foci = {
            dmn: [[-2, -54, 28], [32, -18, -14], [-42, 28, -10], [-58, -48, 18]],
            attention: [[-42, 32, 30], [42, 32, 30], [-32, -56, 48], [32, -54, 48]],
            ecn: [[-44, 26, 8], [44, 26, 8], [-34, 48, 16], [34, 48, 16]],
            smn: [[-42, -18, 58], [42, -20, 56], [-38, -28, 54], [38, -28, 54]],
        }[this.activationNetwork] || [[-42, -18, 58], [42, -20, 56]];

        return regions.map((region, index) => {
            let value = 0;
            foci.forEach((focus, focusIndex) => {
                const distance = Math.hypot(
                    region.centroid[0] - focus[0],
                    region.centroid[1] - focus[1],
                    region.centroid[2] - focus[2],
                );
                const amplitude = 5.5 + this.hash01(index + focusIndex * 17, focusIndex + 3) * 2.4;
                value = Math.max(value, amplitude * Math.exp(-(distance * distance) / (2 * 27 * 27)));
            });
            value += (this.hash01(index + 91, index + 17) - 0.5) * 1.15;
            return value;
        });
    }

    hash01(a, b) {
        const value = Math.sin((a + 1) * 12.9898 + (b + 1) * 78.233) * 43758.5453;
        return value - Math.floor(value);
    }

    renderCurrentView() {
        this.updateControlLabels();
        switch (this.currentView) {
            case 'topology': this.renderTopology(); break;
            case 'activation': this.renderActivation(); break;
            case 'heatmap': this.renderHeatmap(); break;
            case 'chord': this.renderChord(); break;
            default: break;
        }
    }

    getVisibleIndices() {
        if (!this.data) return [];
        return this.data.regions
            .map((region, index) => ({ region, index }))
            .filter((item) => this.activeNetworks.has(item.region.network))
            .map((item) => item.index);
    }

    getVisibleEdges(threshold, density = 1) {
        const indices = this.getVisibleIndices();
        const candidates = [];
        for (let a = 0; a < indices.length; a++) {
            for (let b = a + 1; b < indices.length; b++) {
                const source = indices[a];
                const target = indices[b];
                const value = this.data.matrix[source][target];
                if (Math.abs(value) >= threshold) candidates.push({ source, target, value });
            }
        }
        const possible = indices.length * Math.max(0, indices.length - 1) / 2;
        const limit = Math.min(1200, Math.max(18, Math.round(possible * density)));
        return candidates.sort((x, y) => Math.abs(y.value) - Math.abs(x.value)).slice(0, limit);
    }

    destroyBrainViewers() {
        Object.values(this.brainViewers).forEach((viewer) => {
            try { viewer.destroy(); } catch (e) { /* ignore */ }
        });
        this.brainViewers = {};
    }

    async ensureBrainViewer() {
        if (!this.data) return null;
        const existing = this.brainViewers.topology;
        if (existing && existing.atlasId === this.currentAtlas) {
            existing.setFunctionalInteractionMode(true);
            try { existing.nv.drawScene(); } catch (e) { /* ignore */ }
            return existing;
        }
        if (existing) {
            try { existing.destroy(); } catch (e) { /* ignore */ }
        }

        const viewer = new NiiVueViewer('functionalTopologyStage');
        this.brainViewers.topology = viewer;
        await viewer.loadAtlas(this.currentAtlas, false);
        viewer.setFunctionalInteractionMode(true);
        try { viewer.nv.setRenderAzimuthElevation(-35, 12); } catch (e) { /* ignore */ }
        viewer.nv.onAzimuthElevationChange = () => this.scheduleTopologyOverlay();
        viewer.canvas.addEventListener('pointerup', () => this.scheduleTopologyOverlay());
        viewer.canvas.addEventListener('wheel', () => this.scheduleTopologyOverlay(), { passive: true });
        viewer.canvas.addEventListener('click', (event) => this.handleTopologyCanvasClick(event, viewer), true);
        return viewer;
    }

    async renderTopology() {
        if (!this.data) return;
        const viewer = await this.ensureBrainViewer();
        if (!viewer) return;

        const threshold = Number(document.getElementById('topologyThreshold')?.value || 42) / 100;
        const indices = this.getVisibleIndices();
        const edges = this.getVisibleEdges(threshold, 0.08);
        if (this.topologySelection?.type === 'edge') {
            const selected = this.topologySelection;
            const included = edges.some((edge) =>
                (edge.source === selected.source && edge.target === selected.target) ||
                (edge.source === selected.target && edge.target === selected.source));
            if (!included && indices.includes(selected.source) && indices.includes(selected.target)) {
                edges.push({ source: selected.source, target: selected.target, value: selected.value });
            }
        }
        const indexToLocal = new Map(indices.map((regionIndex, localIndex) => [regionIndex, localIndex]));
        const degree = new Float32Array(indices.length);
        const localMatrix = indices.map(() => new Array(indices.length).fill(0));

        edges.forEach((edge) => {
            const source = indexToLocal.get(edge.source);
            const target = indexToLocal.get(edge.target);
            if (source === undefined || target === undefined) return;
            localMatrix[source][target] = edge.value;
            localMatrix[target][source] = edge.value;
            degree[source] += Math.abs(edge.value);
            degree[target] += Math.abs(edge.value);
        });

        const maxDegree = Math.max(...degree, 0.01);
        const connectome = {
            name: `${this.data.label}-四网络拓扑`,
            nodeColormap: 'warm',
            nodeColormapNegative: 'cool',
            nodeMinColor: 0,
            nodeMaxColor: 1,
            nodeScale: 2.8,
            edgeColormap: 'warm',
            edgeColormapNegative: 'winter',
            edgeMin: -1,
            edgeMax: 1,
            edgeScale: 1.45,
            nodes: {
                names: indices.map((index) => this.data.regions[index].name),
                x: indices.map((index) => this.data.regions[index].centroid[0]),
                y: indices.map((index) => this.data.regions[index].centroid[1]),
                z: indices.map((index) => this.data.regions[index].centroid[2]),
                color: indices.map((_, localIndex) => 0.22 + Math.sqrt(degree[localIndex] / maxDegree) * 0.78),
                size: indices.map((_, localIndex) => 1.25 + Math.sqrt(degree[localIndex] / maxDegree) * 4.8),
            },
            edges: {
                name: '功能连接',
                connectionMatrix: localMatrix,
            },
        };

        viewer.setFunctionalBaseOpacity(0.14);
        viewer.setFunctionalConnectome(connectome);
        this.topologyData = { indices, edges, degree, maxDegree, projected: [], hitEdges: [] };
        this.renderTopologyOverlay(viewer);

        const meta = document.getElementById('topologyMeta');
        if (meta) {
            meta.textContent = `${indices.length} 个脑区质心节点 · ${edges.length} 条功能连接 · 已显示 ${this.activeNetworks.size}/4 个功能网络`;
        }
        this.updateExplanation();
    }

    handleTopologyCanvasClick(event, viewer) {
        if (!this.topologyData || viewer.functionalCamera?.moved) return;
        const rect = viewer.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        let nearestNode = null;
        let nearestNodeDistance = 13;
        (this.topologyData.projected || []).forEach((point, localIndex) => {
            const distance = Math.hypot(point.x - x, point.y - y);
            if (distance < nearestNodeDistance) {
                nearestNodeDistance = distance;
                nearestNode = localIndex;
            }
        });
        if (nearestNode !== null) {
            this.topologySelection = { type: 'node', index: this.topologyData.indices[nearestNode] };
            this.updateExplanation();
            this.renderTopologyOverlay(viewer);
            return;
        }

        let nearestEdge = null;
        let nearestEdgeDistance = 8;
        (this.topologyData.hitEdges || []).forEach((entry) => {
            for (let i = 1; i < entry.points.length; i++) {
                const a = entry.points[i - 1];
                const b = entry.points[i];
                const vx = b.x - a.x;
                const vy = b.y - a.y;
                const lengthSquared = vx * vx + vy * vy || 1;
                const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / lengthSquared));
                const px = a.x + t * vx;
                const py = a.y + t * vy;
                const distance = Math.hypot(px - x, py - y);
                if (distance < nearestEdgeDistance) {
                    nearestEdgeDistance = distance;
                    nearestEdge = entry.edge;
                }
            }
        });
        if (nearestEdge) {
            this.topologySelection = { type: 'edge', ...nearestEdge };
            this.updateExplanation();
            this.renderTopologyOverlay(viewer);
        }
    }

    scheduleTopologyOverlay() {
        cancelAnimationFrame(this._overlayFrame);
        this._overlayFrame = requestAnimationFrame(() => {
            const viewer = this.brainViewers.topology;
            if (viewer && this.topologyData) this.renderTopologyOverlay(viewer);
        });
    }

    renderTopologyOverlay(viewer) {
        const svg = document.getElementById('topologyHitOverlay');
        if (!svg || !this.topologyData) return;
        const { indices, edges } = this.topologyData;
        const width = svg.clientWidth || viewer.canvas.clientWidth;
        const height = svg.clientHeight || viewer.canvas.clientHeight;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.innerHTML = '';

        const points = viewer.projectFunctionalPoints(indices.map((index) => this.data.regions[index].centroid));
        this.topologyData.projected = points;

        const ns = 'http://www.w3.org/2000/svg';
        const make = (tag, attrs) => {
            const element = document.createElementNS(ns, tag);
            Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
            return element;
        };


        edges.forEach((edge, edgeIndex) => {
            const sourceIndex = indices.indexOf(edge.source);
            const targetIndex = indices.indexOf(edge.target);
            const a3 = this.data.regions[edge.source].centroid;
            const b3 = this.data.regions[edge.target].centroid;
            const curvePoints = [];
            const distance = Math.hypot(b3[0] - a3[0], b3[1] - a3[1], b3[2] - a3[2]);
            const midpoint = [(a3[0] + b3[0]) / 2, (a3[1] + b3[1]) / 2, (a3[2] + b3[2]) / 2];
            const radialLength = Math.hypot(midpoint[0], midpoint[1], midpoint[2]) || 1;
            const lift = 7 + distance * 0.17;
            const control = [
                midpoint[0] + midpoint[0] / radialLength * lift,
                midpoint[1] + midpoint[1] / radialLength * lift,
                midpoint[2] + midpoint[2] / radialLength * lift,
            ];
            for (let step = 0; step <= 10; step++) {
                const t = step / 10;
                const u = 1 - t;
                curvePoints.push([
                    u * u * a3[0] + 2 * u * t * control[0] + t * t * b3[0],
                    u * u * a3[1] + 2 * u * t * control[1] + t * t * b3[1],
                    u * u * a3[2] + 2 * u * t * control[2] + t * t * b3[2],
                ]);
            }
            const projectedCurve = viewer.projectFunctionalPoints(curvePoints);
            this.topologyData.hitEdges.push({ edge, points: projectedCurve });
            const pathData = projectedCurve.map((point, index) =>
                `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
            const strength = Math.abs(edge.value);
            const sourceNetwork = this.data.regions[edge.source].network;
            const targetNetwork = this.data.regions[edge.target].network;
            const sameNetwork = sourceNetwork === targetNetwork;
            svg.appendChild(make('path', {
                d: pathData,
                class: 'topology-visible-edge',
                stroke: sameNetwork ? FUNCTIONAL_NETWORKS[sourceNetwork].color : '#94A3B8',
                'stroke-width': String(0.35 + Math.pow(strength, 2) * 4.2),
                'stroke-opacity': sameNetwork
                    ? String(0.16 + strength * 0.28)
                    : String(0.06 + strength * 0.12),
            }));

            const hit = make('path', {
                d: pathData,
                class: 'topology-hit-edge',
                'stroke-width': 9,
                'data-edge-index': edgeIndex,
            });
            hit.addEventListener('click', (event) => {
                event.stopPropagation();
                this.topologySelection = { type: 'edge', ...edge };
                this.updateExplanation();
                this.renderTopologyOverlay(viewer);
            });
            svg.appendChild(hit);

            const selected = this.topologySelection?.type === 'edge'
                && this.topologySelection.source === edge.source
                && this.topologySelection.target === edge.target;
            if (selected) {
                svg.appendChild(make('path', {
                    d: pathData,
                    class: 'selected-edge-line',
                }));
            }
        });

        indices.forEach((regionIndex, localIndex) => {
            const point = points[localIndex];
            const region = this.data.regions[regionIndex];
            const selected = this.topologySelection?.type === 'node' && this.topologySelection.index === regionIndex;
            const degree = this.topologyData.degree?.[localIndex] || 0;
            const maxDegree = this.topologyData.maxDegree || 1;
            svg.appendChild(make('circle', {
                cx: point.x,
                cy: point.y,
                r: String(2.1 + Math.sqrt(Math.max(0, degree) / maxDegree) * 2.8),
                class: 'topology-visible-node',
                fill: FUNCTIONAL_NETWORKS[region.network].color,
            }));
            const hit = make('circle', {
                cx: point.x,
                cy: point.y,
                r: selected ? 11 : 8,
                class: 'topology-hit-node',
            });
            hit.addEventListener('click', (event) => {
                event.stopPropagation();
                this.topologySelection = { type: 'node', index: regionIndex };
                this.updateExplanation();
                this.renderTopologyOverlay(viewer);
            });
            svg.appendChild(hit);

            if (selected) {
                svg.appendChild(make('circle', {
                    cx: point.x,
                    cy: point.y,
                    r: 12,
                    class: 'selected-node-ring',
                }));
            }
        });
    }

    renderHeatmap() {
        if (!this.data) return;
        const container = document.getElementById('chartHeatmap');
        if (!container) return;
        const chart = this.getChart('chartHeatmap', container);
        const networkOrder = ['dmn', 'attention', 'ecn', 'smn'];
        const indices = [];
        networkOrder.forEach((network) => {
            this.data.regions.forEach((region, index) => {
                if (region.network === network) indices.push(index);
            });
        });

        const labels = indices.map((index) => this.data.regions[index].name);
        const showLabels = labels.length <= 64;
        const data = [];
        for (let i = 0; i < indices.length; i++) {
            for (let j = 0; j < indices.length; j++) {
                const value = i === j ? 1 : this.data.matrix[indices[i]][indices[j]];
                data.push([j, i, Number(value.toFixed(3)), indices[i], indices[j]]);
            }
        }

        const groups = [];
        let cursor = 0;
        networkOrder.forEach((network) => {
            const count = indices.filter((index) => this.data.regions[index].network === network).length;
            if (!count) return;
            groups.push({
                network,
                start: cursor,
                end: cursor + count - 1,
            });
            cursor += count;
        });

        const markAreaData = [];
        groups.forEach((group) => {
            markAreaData.push([
                {
                    name: FUNCTIONAL_NETWORKS[group.network].short,
                    xAxis: labels[group.start],
                    yAxis: labels[group.start],
                    itemStyle: {
                        color: 'transparent',
                        borderColor: FUNCTIONAL_NETWORKS[group.network].color,
                        borderWidth: 2,
                    },
                    label: { show: false },
                },
                {
                    xAxis: labels[group.end],
                    yAxis: labels[group.end],
                },
            ]);
        });

        chart.setOption({
            animation: false,
            grid: { left: showLabels ? 150 : 58, right: 82, top: 32, bottom: showLabels ? 150 : 62 },
            tooltip: {
                formatter: (params) => {
                    const row = this.data.regions[params.value[3]];
                    const column = this.data.regions[params.value[4]];
                    return `<strong>${row.name}</strong> · ${FUNCTIONAL_NETWORKS[row.network].short}<br/>` +
                        `<strong>${column.name}</strong> · ${FUNCTIONAL_NETWORKS[column.network].short}<br/>` +
                        `连接强度 r = ${params.value[2].toFixed(3)}`;
                },
            },
            xAxis: {
                type: 'category',
                data: labels,
                splitArea: { show: true },
                axisLabel: {
                    show: showLabels,
                    rotate: 60,
                    fontSize: 8,
                    formatter: (value) => value,
                    color: '#475569',
                },
            },
            yAxis: {
                type: 'category',
                data: labels,
                splitArea: { show: true },
                axisLabel: { show: showLabels, fontSize: 8, color: '#475569' },
            },
            visualMap: {
                min: -1,
                max: 1,
                calculable: true,
                orient: 'vertical',
                right: 8,
                top: 'center',
                text: ['正相关 r=1', '负相关 r=-1'],
                textStyle: { color: '#64748B', fontSize: 10 },
                inRange: { color: ['#2166AC', '#67A9CF', '#D1E5F0', '#F7F7F7', '#FDDBC7', '#EF8A62', '#B2182B'] },
            },
            dataZoom: [
                { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
                { type: 'inside', yAxisIndex: 0, filterMode: 'none' },
                { type: 'slider', xAxisIndex: 0, height: 16, bottom: 12 },
            ],
            series: [{
                type: 'heatmap',
                data,
                itemStyle: { borderColor: 'rgba(255,255,255,0.12)', borderWidth: labels.length <= 70 ? 1 : 0 },
                emphasis: { itemStyle: { borderColor: '#111827', borderWidth: 2 } },
                markArea: { silent: true, data: markAreaData },
            }],
        }, true);

        chart.off('click');
        chart.on('click', (params) => {
            if (params.componentType !== 'series' || !Array.isArray(params.value)) return;
            this.setHeatmapPair(Number(params.value[3]), Number(params.value[4]));
        });

        if (container._heatmapClickHandler) {
            container.removeEventListener('click', container._heatmapClickHandler, true);
        }
        container._heatmapClickHandler = (event) => {
            const rect = container.getBoundingClientRect();
            const pixel = [event.clientX - rect.left, event.clientY - rect.top];
            const point = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, pixel);
            if (!Array.isArray(point)) return;
            const columnIndex = Math.round(Number(point[0]));
            const rowIndex = Math.round(Number(point[1]));
            if (columnIndex < 0 || rowIndex < 0 || columnIndex >= indices.length || rowIndex >= indices.length) return;
            this.setHeatmapPair(indices[rowIndex], indices[columnIndex]);
        };
        container.addEventListener('click', container._heatmapClickHandler, true);

        const meta = document.getElementById('heatmapMeta');
        if (meta) {
            meta.textContent = `${indices.length} × ${indices.length} 方阵 · 按 DMN → 注意 → ECN → SMN 排序并绘制分组边框 · 点击方格联动三维拓扑图`;
        }
        this.updateExplanation();
    }

    renderChord() {
        const container = document.getElementById('chartChord');
        if (!container || !this.data) return;
        container.innerHTML = '';
        const threshold = Number(document.getElementById('chordThreshold')?.value || 52) / 100;
        const domainIndices = this.getVisibleIndices();
        const allEdges = this.getVisibleEdges(threshold, 1);
        const strength = new Float32Array(this.data.regions.length);
        allEdges.forEach((edge) => {
            strength[edge.source] += Math.abs(edge.value);
            strength[edge.target] += Math.abs(edge.value);
        });
        const nodeLimit = Math.min(54, domainIndices.length);
        const included = domainIndices
            .sort((a, b) => strength[b] - strength[a])
            .slice(0, nodeLimit)
            .sort((a, b) => this.data.regions[a].centroid[0] - this.data.regions[b].centroid[0]);
        const includedSet = new Set(included);
        const edges = allEdges
            .filter((edge) => includedSet.has(edge.source) && includedSet.has(edge.target))
            .slice(0, 720);

        const width = Math.max(560, container.clientWidth || 900);
        const height = Math.max(470, container.clientHeight || 620);
        const size = Math.min(width, height);
        const cx = width / 2;
        const cy = height / 2 + 6;
        const radius = size * 0.36;
        const positions = new Map();

        included.forEach((regionIndex, order) => {
            const angle = -Math.PI / 2 + order / included.length * Math.PI * 2;
            positions.set(regionIndex, {
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
                angle,
            });
        });

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', `${this.data.label} 四网络功能连接弦图`);
        svg.classList.add('functional-chord-svg');

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${this.data.label} 四网络功能连接弦图`;
        svg.appendChild(title);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#CBD5E1');
        circle.setAttribute('stroke-width', '1');
        svg.appendChild(circle);

        edges.forEach((edge) => {
            const source = positions.get(edge.source);
            const target = positions.get(edge.target);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', edge.value >= 0 ? '#0F766E' : '#BE123C');
            path.setAttribute('stroke-width', String(0.45 + Math.abs(edge.value) * 5.2));
            path.setAttribute('stroke-opacity', String(0.12 + Math.abs(edge.value) * 0.48));
            path.setAttribute('stroke-linecap', 'round');
            const edgeTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            edgeTitle.textContent = `${this.data.regions[edge.source].name} ↔ ${this.data.regions[edge.target].name}：${edge.value.toFixed(3)}`;
            path.appendChild(edgeTitle);
            svg.appendChild(path);
        });

        included.forEach((regionIndex) => {
            const region = this.data.regions[regionIndex];
            const position = positions.get(regionIndex);
            const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            node.setAttribute('cx', position.x);
            node.setAttribute('cy', position.y);
            node.setAttribute('r', String(3.4 + Math.sqrt(strength[regionIndex]) * 1.45));
            node.setAttribute('fill', region.color);
            node.setAttribute('stroke', '#FFFFFF');
            node.setAttribute('stroke-width', '1');
            const nodeTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            nodeTitle.textContent = `${region.name}（${region.code}）`;
            node.appendChild(nodeTitle);
            svg.appendChild(node);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const outside = radius + 12;
            const x = cx + Math.cos(position.angle) * outside;
            const y = cy + Math.sin(position.angle) * outside;
            label.setAttribute('x', String(x));
            label.setAttribute('y', String(y + 3));
            label.setAttribute('text-anchor', Math.cos(position.angle) >= 0 ? 'start' : 'end');
            label.setAttribute('fill', '#475569');
            label.setAttribute('font-size', included.length > 38 ? '8' : '9.5');
            label.textContent = region.name.length > 12 ? `${region.name.slice(0, 11)}…` : region.name;
            svg.appendChild(label);
        });

        container.appendChild(svg);
        const meta = document.getElementById('chordMeta');
        if (meta) {
            meta.textContent = `已选 ${this.activeNetworks.size}/4 个功能网络 · 显示连接度最高的 ${included.length} 个 ROI · ${edges.length} 条连接`;
        }
        this.updateExplanation();
    }

    updateExplanation() {
        const titles = {
            topology: '三维脑模型拓扑连接图',
            activation: '激活图（统计参数图）',
            heatmap: '功能连接矩阵热力图',
            chord: '功能连接弦图',
        };
        const summaries = {
            topology: '节点位于脑区三维质心，连线表示脑区之间的功能连接。节点和连线按 DMN、注意、ECN、SMN 四个固定网络分组，可用复选框任意叠加或隐藏。',
            activation: '底层使用标准 MNI152 灰度脑模板，统计 Z 图仅在脑组织内部透明叠加。三张切片从左到右依次为轴位、矢状位和冠状位。',
            heatmap: '横轴和纵轴都是脑区，方格颜色表示 Pearson 相关系数 r。矩阵按 DMN、注意、ECN、SMN 分组排序，并用边框区分网络块。',
            chord: '脑区沿圆环排列，弧线连接两个脑区。粗细和颜色编码连接强度与正负方向。',
        };
        const interactions = {
            topology: '拖动旋转、滚轮缩放；点击节点或连线查看详情；复选框控制四个网络的显示；阈值滑块过滤弱连接。',
            activation: '拖动每张切片下方的 X/Y/Z 滑块改变切片层；右上角阈值控制显示的 |Z|。',
            heatmap: '悬停方格查看脑区和 r 值；点击方格后，可在右侧通过“在三维拓扑图中查看”联动一对脑区。',
            chord: '悬停节点或弧线查看名称和连接值，拖动阈值筛选强连接。',
        };

        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        setText('funcInfoTitle', titles[this.currentView] || '功能网络可视化');
        setText('funcInfoSummary', summaries[this.currentView] || '');
        setText('funcInfoInteraction', interactions[this.currentView] || '');

        let networkText = '—';
        let regionText = '—';
        let targetText = '—';
        let valueText = '—';
        let interpretation = '点击拓扑节点、连接或热力图方格后，这里会显示对应网络和脑区信息。';

        if (this.currentView === 'activation') {
            const network = FUNCTIONAL_NETWORKS[this.activationNetwork];
            networkText = network.label;
            regionText = '体素级统计参数图';
            targetText = 'MNI152 标准脑模板';
            valueText = `显示 |Z| ≥ ${Number(document.getElementById('activationThreshold')?.value || 3).toFixed(1)}`;
            interpretation = network.description;
        } else if (this.currentView === 'topology' && this.topologySelection) {
            const selection = this.topologySelection;
            if (selection.type === 'node') {
                const region = this.data.regions[selection.index];
                networkText = FUNCTIONAL_NETWORKS[region.network].label;
                regionText = `${region.name}（${region.code}）`;
                let strength = 0;
                this.getVisibleIndices().forEach((index) => {
                    if (index !== selection.index) strength += Math.abs(this.data.matrix[selection.index][index]);
                });
                valueText = `域内连接强度和 ${strength.toFixed(2)}`;
                interpretation = FUNCTIONAL_NETWORKS[region.network].description;
            } else {
                const source = this.data.regions[selection.source];
                const target = this.data.regions[selection.target];
                networkText = source.network === target.network
                    ? FUNCTIONAL_NETWORKS[source.network].label
                    : `${FUNCTIONAL_NETWORKS[source.network].short} ↔ ${FUNCTIONAL_NETWORKS[target.network].short}`;
                regionText = source.name;
                targetText = target.name;
                valueText = `r = ${Number(selection.value).toFixed(3)}`;
                interpretation = `${FUNCTIONAL_NETWORKS[source.network].description} 对端脑区属于${FUNCTIONAL_NETWORKS[target.network].label}。`;
            }
        } else if (this.currentView === 'heatmap' && this.heatmapPair) {
            const source = this.data.regions[this.heatmapPair.source];
            const target = this.data.regions[this.heatmapPair.target];
            networkText = source.network === target.network
                ? FUNCTIONAL_NETWORKS[source.network].label
                : `${FUNCTIONAL_NETWORKS[source.network].short} ↔ ${FUNCTIONAL_NETWORKS[target.network].short}`;
            regionText = source.name;
            targetText = target.name;
            valueText = `r = ${Number(this.heatmapPair.value).toFixed(3)}`;
            interpretation = `${FUNCTIONAL_NETWORKS[source.network].description} 点击“在三维拓扑图中查看”可定位这对脑区。`;
        }

        setText('funcInfoNetwork', networkText);
        setText('funcInfoRegion', regionText);
        setText('funcInfoTarget', targetText);
        setText('funcInfoValue', valueText);
        setText('funcInfoInterpretation', interpretation);

        const viewPair = document.getElementById('btnViewPairInTopology');
        if (viewPair) viewPair.hidden = this.currentView !== 'heatmap' || !this.heatmapPair;
    }

    disposeSliceViewers() {
        this.sliceViewers.forEach((viewer) => {
            try { viewer.dispose(); } catch (e) { /* ignore */ }
        });
        this.sliceViewers = [];
    }

    async buildActivationCanvasLayout() {
        const container = document.getElementById('activationVisualization');
        if (!container) return;
        this.disposeSliceViewers();
        container.innerHTML = '';
        const layout = document.createElement('div');
        layout.className = 'activation-slice-grid';

        [
            ['axial', '轴位 Axial'],
            ['sagittal', '矢状位 Sagittal'],
            ['coronal', '冠状位 Coronal'],
        ].forEach(([orientation, label]) => {
            const figure = document.createElement('figure');
            figure.className = 'activation-figure';
            figure.dataset.orientation = orientation;
            layout.appendChild(figure);
            const viewer = new MniSliceViewer(
                figure,
                orientation,
                this.activationNetwork,
                () => viewer.setThreshold(document.getElementById('activationThreshold')?.value || 3),
            );
            this.sliceViewers.push(viewer);
        });

        container.appendChild(layout);
        const meta = document.getElementById('activationMeta');
        if (meta) {
            meta.textContent = `${FUNCTIONAL_NETWORKS[this.activationNetwork].label} · MNI152 灰度底层 + 体素级 Z 图透明叠加 · 支持独立拖动三层切片`;
        }
    }

    async renderActivation() {
        if (!this.sliceViewers.length) await this.buildActivationCanvasLayout();
        const threshold = Number(document.getElementById('activationThreshold')?.value || 3);
        this.sliceViewers.forEach((viewer) => viewer.setThreshold(threshold));
        const meta = document.getElementById('activationMeta');
        if (meta) {
            meta.textContent = `${FUNCTIONAL_NETWORKS[this.activationNetwork].label} · MNI152 灰度底层 + 体素级 Z 图透明叠加 · |Z| ≥ ${threshold.toFixed(1)}`;
        }
        this.updateExplanation();
    }

    setHeatmapPair(source, target) {
        if (!this.data) return;
        const value = source === target ? 1 : this.data.matrix[source][target];
        this.heatmapPair = { source, target, value };
        this.topologySelection = { type: 'edge', source, target, value };
        this.updateExplanation();
    }

    getChart(id, container) {
        if (this.charts[id] && !this.charts[id].isDisposed()) {
            this.charts[id].resize();
            return this.charts[id];
        }
        const chart = echarts.init(container, null, { devicePixelRatio: window.devicePixelRatio || 1 });
        this.charts[id] = chart;
        return chart;
    }

    resizeAll() {
        Object.values(this.charts).forEach((chart) => {
            if (chart && !chart.isDisposed()) chart.resize();
        });
        Object.values(this.brainViewers).forEach((viewer) => {
            try { viewer.nv.drawScene(); } catch (e) { /* ignore */ }
        });
        if (this.currentView === 'topology') this.scheduleTopologyOverlay();
        if (this.currentView === 'activation') this.renderActivation();
        if (this.currentView === 'chord') this.renderChord();
        this.updateExplanation();
    }

    disposeCharts() {
        Object.values(this.charts).forEach((chart) => {
            if (chart && !chart.isDisposed()) chart.dispose();
        });
        this.charts = {};
    }

    getExportCsv() {
        if (!this.data) return '';
        const rows = [['ROI', '功能网络', ...this.data.regions.map((region) => region.name)]];
        this.data.regions.forEach((region, index) => {
            rows.push([region.name, FUNCTIONAL_NETWORKS[region.network].label, ...Array.from(this.data.matrix[index], (value) => value.toFixed(4))]);
        });
        return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    }
}

window.FunctionalNetworkManager = FunctionalNetworkManager;
window.FUNCTIONAL_ATLASES = FUNCTIONAL_ATLASES;
