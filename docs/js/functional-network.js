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

window.ACTIVATION_DATA_CACHE = window.ACTIVATION_DATA_CACHE || new Map();

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

const YEO_OTHER_NETWORK = {
    id: 'other',
    label: '其他',
    short: '其他',
    color: '#94A3B8',
    description: '未匹配到当前 Yeo 功能网络模板的皮层下、小脑或其他区域。',
    parent: 'other',
};

const YEO_NETWORK_TEMPLATES = {
    yeo7: [
        { id: 'y7_visual', label: '网络1-视觉', short: '视觉', color: '#7C3AED', description: '视觉网络，主要处理视觉信息与视觉空间特征。', parent: 'visual' },
        { id: 'y7_somatomotor', label: '网络2-感觉运动', short: '感觉运动', color: '#2563EB', description: '感觉运动网络，参与动作执行与躯体感觉加工。', parent: 'somatomotor' },
        { id: 'y7_dorsal_attention', label: '网络3-背侧注意', short: '背侧注意', color: '#10B981', description: '背侧注意网络，参与自上而下的空间注意与目标导向加工。', parent: 'dorsal_attention' },
        { id: 'y7_salience', label: '网络4-腹侧注意/突显', short: '腹侧注意', color: '#A78BFA', description: '腹侧注意/突显网络，负责显著信息检测与注意资源切换。', parent: 'salience' },
        { id: 'y7_limbic', label: '网络5-边缘系统', short: '边缘系统', color: '#FDE68A', description: '边缘系统网络，参与情绪、记忆与内脏信息加工。', parent: 'limbic' },
        { id: 'y7_frontoparietal', label: '网络6-额顶控制', short: '额顶控制', color: '#F97316', description: '额顶控制网络，参与工作记忆、认知控制与目标维护。', parent: 'frontoparietal' },
        { id: 'y7_default', label: '网络7-默认模式', short: '默认模式', color: '#EF4444', description: '默认模式网络，参与内部思考、情景记忆与自我参照加工。', parent: 'default' },
        YEO_OTHER_NETWORK,
    ],
    yeo17: [
        { id: 'y17_visual_a', label: '视觉A', short: '视觉A', color: '#6D28D9', description: '视觉网络 A 子网络。', parent: 'visual' },
        { id: 'y17_visual_b', label: '视觉B', short: '视觉B', color: '#A855F7', description: '视觉网络 B 子网络。', parent: 'visual' },
        { id: 'y17_somatomotor_a', label: '感觉运动A', short: '感觉运动A', color: '#1D4ED8', description: '感觉运动网络 A 子网络。', parent: 'somatomotor' },
        { id: 'y17_somatomotor_b', label: '感觉运动B', short: '感觉运动B', color: '#60A5FA', description: '感觉运动网络 B 子网络。', parent: 'somatomotor' },
        { id: 'y17_dorsal_attention_a', label: '背侧注意A', short: '背侧注意A', color: '#047857', description: '背侧注意网络 A 子网络。', parent: 'dorsal_attention' },
        { id: 'y17_dorsal_attention_b', label: '背侧注意B', short: '背侧注意B', color: '#34D399', description: '背侧注意网络 B 子网络。', parent: 'dorsal_attention' },
        { id: 'y17_salience_a', label: '腹侧注意A', short: '腹侧注意A', color: '#0F766E', description: '腹侧注意网络 A 子网络。', parent: 'salience' },
        { id: 'y17_salience_b', label: '腹侧注意B', short: '腹侧注意B', color: '#5EEAD4', description: '腹侧注意网络 B 子网络。', parent: 'salience' },
        { id: 'y17_salience_c', label: '突显A', short: '突显A', color: '#D97706', description: '突显网络 A 子网络。', parent: 'salience' },
        { id: 'y17_salience_d', label: '突显B', short: '突显B', color: '#FBBF24', description: '突显网络 B 子网络。', parent: 'salience' },
        { id: 'y17_limbic_a', label: '边缘系统A', short: '边缘A', color: '#B45309', description: '边缘系统网络 A 子网络。', parent: 'limbic' },
        { id: 'y17_limbic_b', label: '边缘系统B', short: '边缘B', color: '#F59E0B', description: '边缘系统网络 B 子网络。', parent: 'limbic' },
        { id: 'y17_control_a', label: '额顶控制A', short: '控制A', color: '#4338CA', description: '额顶控制网络 A 子网络。', parent: 'frontoparietal' },
        { id: 'y17_control_b', label: '额顶控制B', short: '控制B', color: '#818CF8', description: '额顶控制网络 B 子网络。', parent: 'frontoparietal' },
        { id: 'y17_default_a', label: '默认模式A', short: '默认A', color: '#B91C1C', description: '默认模式网络 A 子网络。', parent: 'default' },
        { id: 'y17_default_b', label: '默认模式B', short: '默认B', color: '#EF4444', description: '默认模式网络 B 子网络。', parent: 'default' },
        { id: 'y17_default_c', label: '默认模式C', short: '默认C', color: '#F87171', description: '默认模式网络 C 子网络。', parent: 'default' },
        YEO_OTHER_NETWORK,
    ],
};

class MniSliceViewer {
    constructor(container, orientation, network, onReady, sharedState = { mni: [0, 0, 12], listeners: new Set() }, onProbe = null) {
        this.container = container;
        this.sharedState = sharedState;
        this.onProbe = onProbe;
        this.sharedState.listeners ||= new Set();
        this.sharedState.listeners.add(this);
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
        this.nv.onLocationChange = (loc) => {
            if (!loc?.mm) return;
            this.setSharedMni(loc.mm);
            if (this.onProbe) this.onProbe(this.probeActivation(loc.mm));
        };

        this.slider.addEventListener('input', () => {
            const value = Number(this.slider.value);
            this.output.textContent = `${value} mm`;
            const mm = [...(this.sharedState.mni || [0, 0, 12])];
            mm[this.settings.axis] = value;
            this.setSharedMni(mm);
        });

        this.loadVolumes(network);
    }

    async cachedBuffer(url) {
        const cache = window.ACTIVATION_DATA_CACHE;
        if (cache.has(url)) return cache.get(url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        cache.set(url, buffer);
        return buffer;
    }

    async loadVolumes(network) {
        this.network = network;
        try {
            const key = this.activationFileKey(network);
            const mniBuffer = await this.cachedBuffer('./data/MNI152_T1w_1mm.nii.gz');
            let overlayBuffer;
            try {
                overlayBuffer = await this.cachedBuffer(`./data/demo_zstat_${key}.nii.gz`);
            } catch (error) {
                // 网络资源缺失时使用兜底激活图，保持界面可交互而不是空白。
                overlayBuffer = await this.cachedBuffer('./data/demo_zstat_smn.nii.gz');
            }
            const mni = await niivue.NVImage.loadFromUrl({ url: 'array.nii.gz', buffer: mniBuffer, name: 'MNI152_T1w_1mm.nii.gz', colormap: 'gray', opacity: 1.0, ignoreZeroVoxels: false });
            const overlay = await niivue.NVImage.loadFromUrl({ url: 'array.nii.gz', buffer: overlayBuffer, name: `demo_zstat_${key}.nii.gz`, colormap: 'warm', colormapNegative: 'winter', opacity: 0.72, ignoreZeroVoxels: true, cal_min: this.threshold, cal_max: 8 });
            this.nv.volumes = [];
            this.nv.addVolume(mni);
            this.nv.addVolume(overlay);
            const overlayVolume = this.nv.volumes[1];
            if (overlayVolume) {
                overlayVolume.useNegativeCmap = true;
                overlayVolume.cal_min = this.threshold;
                overlayVolume.cal_max = 8;
                overlayVolume.cal_minNeg = this.threshold;
                overlayVolume.cal_maxNeg = 8;
                overlayVolume.opacity = 0.72;
            }
            this.ready = true;
            this.applySharedMni();
            this.onReady(this);
            return true;
        } catch (error) {
            console.error('[MniSliceViewer] 切片加载失败:', error);
            this.ready = false;
            return false;
        }
    }

    setSharedMni(mm) {
        if (this.sharedState.syncing) return;
        const bounds = [[-98, 98], [-134, 98], [-72, 106]];
        const next = [0, 1, 2].map((axis) => Math.max(bounds[axis][0], Math.min(bounds[axis][1], Number(mm[axis]) || 0)));
        this.sharedState.mni = next;
        this.sharedState.syncing = true;
        try {
            this.sharedState.listeners.forEach((viewer) => viewer.applySharedMni());
        } finally {
            this.sharedState.syncing = false;
        }
    }

    applySharedMni() {
        if (!this.ready) return;
        const mm = this.sharedState.mni || [0, 0, 12];
        this.slider.value = String(Math.round(mm[this.settings.axis]));
        this.output.textContent = `${Math.round(mm[this.settings.axis])} mm`;
        this.setSlicePosition(mm);
    }

    setSlicePosition(mm) {
        if (!this.ready) return;
        try {
            const frac = this.nv.mm2frac(mm);
            this.nv.scene.crosshairPos = frac;
            this.nv.createOnLocationChange();
            this.nv.drawScene();
        } catch (error) {
            console.warn('[MniSliceViewer] 设置切片位置失败:', error);
        }
    }

    activationFileKey(network) {
        return ({
            y7_visual: 'visual',
            y7_somatomotor: 'somatomotor',
            y7_dorsal_attention: 'dorsal',
            y7_salience: 'salience',
            y7_limbic: 'limbic',
            y7_frontoparietal: 'frontoparietal',
            y7_default: 'default',
            y17_visual_a: 'visual',
            y17_visual_b: 'visual',
            y17_somatomotor_a: 'somatomotor',
            y17_somatomotor_b: 'somatomotor',
            y17_dorsal_attention_a: 'dorsal',
            y17_dorsal_attention_b: 'dorsal',
            y17_salience_a: 'salience',
            y17_salience_b: 'salience',
            y17_salience_c: 'salience',
            y17_salience_d: 'salience',
            y17_limbic_a: 'limbic',
            y17_limbic_b: 'limbic',
            y17_control_a: 'frontoparietal',
            y17_control_b: 'frontoparietal',
            y17_default_a: 'default',
            y17_default_b: 'default',
            y17_default_c: 'default',
        })[network] || network;
    }

    probeActivation(mm) {
        const overlay = this.nv.volumes?.[1];
        if (!overlay?.img) return { network: this.network, mni: [Number(mm[0]) || 0, Number(mm[1]) || 0, Number(mm[2]) || 0], z: 0 };
        const dims = overlay.dims || overlay.hdr?.dims || [];
        const nx = Number(dims[1] || 0), ny = Number(dims[2] || 0);
        const x = Math.round(Number(mm[0]) + 98);
        const y = Math.round(Number(mm[1]) + 134);
        const z = Math.round(Number(mm[2]) + 72);
        const index = (z * ny + y) * nx + x;
        return {
            network: this.network,
            mni: [Number(mm[0]) || 0, Number(mm[1]) || 0, Number(mm[2]) || 0],
            z: Number(overlay.img[index] || 0),
        };
    }

    async setNetwork(network) {
        if (this.network === network && this.ready) return true;
        this.ready = false;
        return await this.loadVolumes(network);
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
        this.yeoTemplate = 'yeo7';
        this.topologyActiveNetworks = new Set(YEO_NETWORK_TEMPLATES[this.yeoTemplate].map((network) => network.id));
        this.focusedNetwork = null;
        this.activationNetwork = 'y7_somatomotor';
        this.activationProbe = null;
        this.heatmapNetworkFilter = null;
        this.data = null;
        this.charts = {};
        this.brainViewers = {};
        this.sliceViewers = [];
        this.sharedMni = { mni: [0, 0, 12], listeners: new Set() };
        this.topologySelection = null;
        this.heatmapPair = null;
        this._resizeTimer = null;
        this._overlayFrame = null;
        this.networkRenderer = null;
        this.onlySelectedTopology = false;
        this.topologyAllMode = true;
        this.brainOpacity = 0.34;
        this.resourceManager = typeof NetworkResourceManager !== 'undefined' ? new NetworkResourceManager({
            onProgress: (message) => {
                const status = document.getElementById('functionalDataStatus');
                if (status) status.textContent = message;
            },
        }) : null;
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
                if (this.currentView === 'activation') {
                    // 激活图是独立视图状态，每次进入都回到网络1，不继承拓扑选择。
                    this.activationNetwork = 'y7_visual';
                    this.activationProbe = null;
                }
                if (this.currentView === 'topology') {
                    this.clearTopologyHighlightState();
                    this.topologyAllMode = true;
                    this.topologyActiveNetworks = new Set(this.getYeoNetworks().map((item) => item.id));
                    this.focusedNetwork = null;
                    this.networkRenderer?.setFocusNetwork(null);
                    this.networkRenderer?.setPickingLocked(true);
                }
                if (this.currentView === 'heatmap') {
                    // 热力图初始状态始终是全网络合并大图。
                    this.heatmapNetworkFilter = null;
                    this.focusedNetwork = null;
                }
                document.querySelectorAll('#funcTabs .func-tab').forEach((item) => {
                    item.classList.toggle('active', item === tab);
                });
                document.querySelectorAll('#module2 .func-view').forEach((panel) => {
                    panel.classList.toggle('active', panel.id === `view-${this.currentView}`);
                });
                this.renderNetworkSidebar();
                requestAnimationFrame(() => this.renderCurrentView());
            });
        });
    }

    bindControls() {
        const yeoSelect = document.getElementById('yeoTemplateSelect');
        if (yeoSelect) {
            yeoSelect.addEventListener('change', async () => {
                await this.setYeoTemplate(yeoSelect.value);
            });
        }

        const brainOpacity = document.getElementById('brainOpacity');
        if (brainOpacity) {
            brainOpacity.addEventListener('input', () => {
                this.brainOpacity = Number(brainOpacity.value) / 100;
                const label = document.getElementById('brainOpacityValue');
                if (label) label.textContent = `${brainOpacity.value}%`;
                if (this.networkRenderer) this.networkRenderer.setBrainOpacity(this.brainOpacity);
            });
        }

        const onlySelected = document.getElementById('btnOnlySelected');
        if (onlySelected) {
            onlySelected.addEventListener('click', () => {
                this.clearTopologyHighlightState();
                this.topologyAllMode = true;
                this.topologyActiveNetworks = new Set(this.getYeoNetworks().map((item) => item.id));
                this.focusedNetwork = null;
                this.networkRenderer?.setFocusNetwork(null);
                if (this.networkRenderer) {
                    this.hideSourceMeshes(this.brainViewers.topology);
                    this.networkRenderer.setOnlySelected(false);
                    // 全部连接模式禁用单条连线拾取，只能整体查看。
                    this.networkRenderer.setPickingLocked(true);
                }
                this.renderNetworkSidebar();
                if (this.currentView === 'topology') this.renderTopology();
                this.updateExplanation();
            });
        }
        const resetSelection = document.getElementById('btnResetSelection');
        if (resetSelection) {
            resetSelection.addEventListener('click', () => {
                this.clearTopologyHighlightState();
                this.topologyAllMode = true;
                this.networkRenderer?.setPickingLocked(true);
                this.updateExplanation();
            });
        }

        ['heatmapThreshold', 'heatmapRangeMin', 'heatmapRangeMax'].forEach((id) => {
            const control = document.getElementById(id);
            if (!control) return;
            control.addEventListener('input', () => {
                if (id === 'heatmapThreshold') {
                    const value = Number(control.value) / 100;
                    const label = document.getElementById('heatmapThresholdValue');
                    if (label) label.textContent = value.toFixed(2);
                }
                if (this.currentView === 'heatmap') this.renderHeatmap();
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
                    this.topologyActiveNetworks = new Set([network]);
                    this.focusedNetwork = network;
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
                this.topologyActiveNetworks = new Set(this.getYeoNetworks().map((network) => network.id));
                this.focusedNetwork = null;
                this.renderNetworkControls();
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

    getYeoNetworks() {
        return YEO_NETWORK_TEMPLATES[this.yeoTemplate] || YEO_NETWORK_TEMPLATES.yeo7;
    }

    getNetworkDefinition(networkId) {
        return this.getYeoNetworks().find((network) => network.id === networkId) || YEO_OTHER_NETWORK;
    }

    clearTopologyHighlightState() {
        this.topologySelection = null;
        this.onlySelectedTopology = false;
        this.networkRenderer?.setPickingLocked(false);
        this.networkRenderer?.setOnlySelected(false);
        this.networkRenderer?.clearHighlight();
        this.networkRenderer?.setRoiHighlight([]);
        this.networkRenderer?.setSelection(null);
        this.brainViewers.topology?.setFunctionalHighlightIds([]);
    }

    async setYeoTemplate(template) {
        this.yeoTemplate = template === 'yeo17' ? 'yeo17' : 'yeo7';
        if (this.resourceManager) {
            try {
                this.templateResource = await this.resourceManager.ensure(this.yeoTemplate === 'yeo17' ? 'schaefer17' : 'schaefer7');
            } catch (error) {
                this.templateResource = null;
                this.onToast(`网络图谱资源暂不可用：${error.message}`, 'error');
            }
        }
        if (this.data) {
            this.data.regions.forEach((region, index) => {
                region.network = this.mapRegionToYeoNetwork(region, index);
            });
        }
        this.clearTopologyHighlightState();
        this.topologyActiveNetworks = new Set(this.getYeoNetworks().map((network) => network.id));
        this.focusedNetwork = null;
        this.heatmapNetworkFilter = null;
        this.activationProbe = null;
        this.networkRenderer?.setFocusNetwork(null);
        this.renderNetworkControls();
        this.renderNetworkSidebar();
        this.updateExplanation();
        if (this.currentView === 'topology') this.refreshTopologyStyles();
        else if (this.currentView === 'heatmap') this.renderHeatmap();
        else if (this.currentView === 'activation') await this.renderActivation();
    }

    bindNetworkControls() {
        const bar = document.getElementById('networkCheckboxBar');
        if (!bar || bar._networkChangeBound) return;
        bar._networkChangeBound = true;
        bar.addEventListener('change', (event) => {
            const checkbox = event.target.closest('input[data-network]');
            if (!checkbox) return;
            const network = checkbox.dataset.network;
            if (checkbox.checked) this.topologyActiveNetworks.add(network);
            else this.topologyActiveNetworks.delete(network);

            if (this.topologyActiveNetworks.size === 0) {
                checkbox.checked = true;
                this.topologyActiveNetworks.add(network);
                this.onToast('至少保留一个功能网络', 'info');
            }
            if (this.focusedNetwork && !this.topologyActiveNetworks.has(this.focusedNetwork)) {
                this.focusedNetwork = null;
            }
            this.topologySelection = null;
            this.renderNetworkSidebar();
            if (this.currentView === 'topology') this.renderTopology();
            this.updateExplanation();
        });
    }

    renderNetworkControls() {
        const bar = document.getElementById('networkCheckboxBar');
        if (bar) bar.innerHTML = '';
    }

    getSidebarNetworks() {
        return this.currentView === 'activation'
            ? YEO_NETWORK_TEMPLATES.yeo7.filter((network) => network.id !== 'other')
            : this.getYeoNetworks();
    }

    getActivationNetworkDefinition(networkId) {
        return YEO_NETWORK_TEMPLATES.yeo7.find((network) => network.id === networkId)
            || YEO_NETWORK_TEMPLATES.yeo7[YEO_NETWORK_TEMPLATES.yeo7.length - 1];
    }

    renderNetworkSidebar() {
        const legend = document.getElementById('yeoNetworkLegend');
        const stats = document.getElementById('yeoNetworkStats');
        if (!legend || !stats || !this.data) return;

        const networks = this.getSidebarNetworks();
        const volumes = new Map(networks.map((network) => [network.id, 0]));
        let totalVolume = 0;
        this.data.regions.forEach((region) => {
            const volume = Number(region.volume_mm3) || 0;
            totalVolume += volume;
            const networkId = volumes.has(region.network) ? region.network : 'other';
            volumes.set(networkId, (volumes.get(networkId) || 0) + volume);
        });

        legend.innerHTML = networks.map((network) => `
            <button class="yeo-legend-item ${this.focusedNetwork === network.id ? 'active' : ''}" data-network="${network.id}">
                <span class="network-dot" style="background:${network.color};"></span>
                <span>${network.label}</span>
            </button>
        `).join('');
        legend.querySelectorAll('[data-network]').forEach((button) => {
            button.addEventListener('click', async () => {
                const network = button.dataset.network;
                const sameNetwork = this.focusedNetwork === network;
                this.clearTopologyHighlightState();
                if (this.currentView === 'topology') {
                    this.clearTopologyHighlightState();
                    this.topologyAllMode = true;
                    this.topologyActiveNetworks = new Set(this.getYeoNetworks().map((item) => item.id));
                    this.focusedNetwork = null;
                    this.networkRenderer?.setFocusNetwork(null);
                    this.networkRenderer?.setPickingLocked(true);
                }
                if (this.currentView === 'heatmap') {
                    this.heatmapNetworkFilter = this.heatmapNetworkFilter === network ? null : network;
                    this.focusedNetwork = this.heatmapNetworkFilter;
                    this.renderNetworkSidebar();
                    this.renderHeatmap();
                    this.updateExplanation();
                    return;
                }
                if (this.currentView === 'activation') {
                    this.activationProbe = null;
                    this.activationNetwork = network;
                    this.focusedNetwork = network;
                    await Promise.all(this.sliceViewers.map((viewer) => viewer.setNetwork(network)));
                    this.renderNetworkSidebar();
                    await this.renderActivation();
                    this.updateExplanation();
                    return;
                }
                this.focusedNetwork = network;
                this.topologyAllMode = false;
                this.topologyActiveNetworks = new Set([network]);
                this.networkRenderer?.setFocusNetwork(network);
                this.networkRenderer?.setPickingLocked(false);
                this.renderNetworkSidebar();
                if (this.currentView === 'topology') this.renderTopology();
                this.updateExplanation();
            });
        });

        const networkCount = networks.filter((network) => network.id !== 'other').length;
        stats.innerHTML = networks.map((network) => {
            const volumeCm3 = (volumes.get(network.id) || 0) / 1000;
            const percent = totalVolume > 0 ? (volumes.get(network.id) || 0) / totalVolume * 100 : 0;
            return `
                <div class="yeo-stat-row">
                    <div class="yeo-stat-head">
                        <span class="yeo-stat-name"><span class="network-dot" style="background:${network.color};"></span>${network.label}</span>
                        <span class="yeo-stat-value">${volumeCm3.toFixed(2)} cm³ · ${percent.toFixed(1)}%</span>
                    </div>
                    <div class="yeo-stat-bar"><span style="width:${Math.max(0, Math.min(100, percent))}%;background:${network.color};"></span></div>
                </div>
            `;
        }).join('') + `
            <div class="yeo-stat-total">
                <span>总计</span>
                <span>${(totalVolume / 1000).toFixed(2)} cm³ · ${networkCount} 个网络</span>
            </div>
        `;
    }

    mapRegionToYeoNetwork(region, index) {
        const text = `${region.name_zh || region.name || ''} ${region.name_en || region.code || ''}`.toLowerCase();
        let parent = 'other';

        if (/视|距状|楔叶|枕|visual|occip|cuneus|calcar|v1|v2|v3|v4|v5|mt|mst/.test(text)) parent = 'visual';
        else if (/中央前|中央后|旁中央|运动|感觉|precentral|postcentral|paracentral|motor|somatosensory|4_roi|3b_roi|s1|s2/.test(text)) parent = 'somatomotor';
        else if (/额眼|顶内|上顶|背侧注意|fef|ips|intraparietal|superior_parietal|dorsal_attention/.test(text)) parent = 'dorsal_attention';
        else if (/岛叶|岛盖|额下|颞顶|腹侧注意|突显|insula|opercul|ifg|temporoparietal|salience|ventral_attention/.test(text)) parent = 'salience';
        else if (/海马|海马旁|内嗅|杏仁|眶额|颞极|边缘|limbic|hippoc|parahippoc|entorhinal|amygd|olfact|temporalpole|ofc/.test(text)) parent = 'limbic';
        else if (/执行|控制|工作记忆|额中|顶下|角回|缘上|frontoparietal|control|working|middle_frontal|inferior_parietal|angular|supramarginal/.test(text)) parent = 'frontoparietal';
        else if (/楔前|后扣带|压后|内侧前额|默认|precuneus|posterior_cingulate|retrosplenial|medial_prefrontal|default/.test(text)) parent = 'default';

        if (parent === 'other') {
            const system = this.inferSystem(region);
            parent = {
                visual: 'visual',
                somatomotor: 'somatomotor',
                dorsal: 'dorsal_attention',
                salience: 'salience',
                limbic: 'limbic',
                frontoparietal: 'frontoparietal',
                default: 'default',
            }[system] || 'other';
        }

        if (parent === 'other') {
            if (/小脑|cerebell|vermis|dentate|丘脑|海马|杏仁|尾状|壳核|苍白|thalam|hippoc|amygd|caudate|putamen|pallid|accumb|subcort/.test(text)) {
                return 'other';
            }
            const centroid = region.centroid || region.centroid_mm || [0, 0, 0];
            const x = Number(centroid[0]) || 0;
            const y = Number(centroid[1]) || 0;
            const z = Number(centroid[2]) || 0;
            if (y < -58) parent = 'visual';
            else if (z > 30 && Math.abs(x) > 18) parent = 'somatomotor';
            else if (y > 18 && z > 6) parent = 'frontoparietal';
            else if (y > 5 && z <= 12) parent = 'salience';
            else if (z < -8 && Math.abs(x) > 22) parent = 'limbic';
            else if (y < -12) parent = 'default';
            else parent = 'dorsal_attention';
        }

        if (this.yeoTemplate === 'yeo7') {
            return {
                visual: 'y7_visual',
                somatomotor: 'y7_somatomotor',
                dorsal_attention: 'y7_dorsal_attention',
                salience: 'y7_salience',
                limbic: 'y7_limbic',
                frontoparietal: 'y7_frontoparietal',
                default: 'y7_default',
            }[parent] || 'other';
        }

        const variant = /(^|[^a-z])(1|2|3a|3b|4|6|primary|初级|中央|a\b)|前部|anterior|rostral|medial|内侧/.test(text) ? 'a' : 'b';
        if (parent === 'visual') return variant === 'a' ? 'y17_visual_a' : 'y17_visual_b';
        if (parent === 'somatomotor') return variant === 'a' ? 'y17_somatomotor_a' : 'y17_somatomotor_b';
        if (parent === 'dorsal_attention') return variant === 'a' ? 'y17_dorsal_attention_a' : 'y17_dorsal_attention_b';
        if (parent === 'limbic') return variant === 'a' ? 'y17_limbic_a' : 'y17_limbic_b';
        if (parent === 'frontoparietal') return variant === 'a' ? 'y17_control_a' : 'y17_control_b';
        if (parent === 'salience') {
            if (/岛叶|前扣带|突显|insula|anterior_cingulate|salience/.test(text)) return variant === 'a' ? 'y17_salience_c' : 'y17_salience_d';
            return variant === 'a' ? 'y17_salience_a' : 'y17_salience_b';
        }
        if (parent === 'default') {
            if (/后扣带|楔前|precuneus|posterior_cingulate/.test(text)) return 'y17_default_a';
            if (/海马|颞|内侧前额|hippoc|temporal|medial_prefrontal/.test(text)) return 'y17_default_b';
            return 'y17_default_c';
        }
        return 'other';
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
        if (status) status.textContent = '正在加载演示连接数据…';

        try {
            let raw;
            if (config.resourceTemplate) {
                raw = await this.loadResourceAtlas(config.resourceTemplate);
            } else {
                const response = await fetch(config.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                raw = await response.json();
            }
            const regions = (raw.regions || []).map((region, index) => this.normalizeRegion(region, index));
            this.data = {
                atlasId: this.currentAtlas,
                label: config.label,
                nominalRegions: config.nominalRegions,
                regions,
                matrix: raw.matrix || this.generateCorrelationMatrix(regions),
                activation: this.generateActivation(regions),
            };
            this.renderNetworkControls();
            this.renderNetworkSidebar();
            this.preloadActivationBuffers();

            if (status) {
                status.textContent = `演示连接数据 · 默认360 分区 · ${regions.length} 个可用 ROI`;
                status.classList.toggle('incomplete', regions.length !== config.nominalRegions);
            }
            const matrixWarning = this.resourceManager?.validateMatrixDistribution?.(this.data.matrix);
            if (matrixWarning) this.onToast(matrixWarning, 'error');
            this.disposeCharts();
            this.destroyBrainViewers();
            this.topologySelection = null;
            this.heatmapPair = null;
            this.heatmapNetworkFilter = null;
            this.focusedNetwork = null;
            this.updateControlLabels();
            this.renderCurrentView();
            this.updateExplanation();
        } catch (error) {
            console.error('[FunctionalNetwork] 图谱数据加载失败:', error);
            if (status) {
                status.textContent = `默认360 分区加载失败：${error.message}`;
                status.classList.add('incomplete');
            }
            this.onToast('功能网络图谱数据加载失败', 'error');
        }
    }

    async preloadActivationBuffers() {
        const cache = window.ACTIVATION_DATA_CACHE;
        const keys = ['visual', 'somatomotor', 'dorsal', 'salience', 'limbic', 'frontoparietal', 'default'];
        await Promise.all(keys.map(async (key) => {
            const url = `./data/demo_zstat_${key}.nii.gz`;
            if (cache.has(url)) return;
            try {
                const response = await fetch(url);
                if (response.ok) cache.set(url, await response.arrayBuffer());
            } catch (error) {
                // 预加载失败不阻塞当前视图，切换时仍有兜底数据。
            }
        }));
    }

    async loadResourceAtlas(templateId) {
        if (!this.resourceManager) this.resourceManager = new NetworkResourceManager();
        const resource = await this.resourceManager.ensure(templateId);
        const image = await niivue.NVImage.loadFromUrl({ url: 'array.nii.gz', buffer: resource.niftiBuffer });
        const dims = image.dims || image.hdr?.dims || [];
        const nx = Number(dims[1] || 0), ny = Number(dims[2] || 0), nz = Number(dims[3] || 0);
        const img = image.img;
        const rows = [image.hdr?.srow_x, image.hdr?.srow_y, image.hdr?.srow_z].map((row) => row || [1, 0, 0, 0]);
        const sums = new Map(), counts = new Map(), seen = new Set();
        for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
            const id = Math.round(Number(img[(z * ny + y) * nx + x]) || 0);
            if (!id) continue;
            seen.add(id);
            const mm = [0, 1, 2].map((r) => rows[r][0] * x + rows[r][1] * y + rows[r][2] * z + rows[r][3]);
            const sum = sums.get(id) || [0, 0, 0];
            sums.set(id, [sum[0] + mm[0], sum[1] + mm[1], sum[2] + mm[2]]);
            counts.set(id, (counts.get(id) || 0) + 1);
        }
        const declared = new Set(resource.labels.map((label) => label.id));
        const missingLabels = [...seen].filter((id) => !declared.has(id));
        const missingVoxels = [...declared].filter((id) => !seen.has(id));
        if (missingLabels.length || missingVoxels.length) throw new Error('标签映射异常：NIfTI 与标签 ID 不一一对应');
        const regions = resource.labels.map((label) => {
            const count = counts.get(label.id) || 1;
            const sum = sums.get(label.id) || [0, 0, 0];
            return { id: label.id, name_zh: label.name, name_en: label.name, color: [120, 132, 148], volume_mm3: count, centroid_mm: sum.map((v) => v / count) };
        });
        const matrix = resource.matrix || this.generateCorrelationMatrix(regions);
        this.resourceManager.validateMatrix(matrix, regions.length);
        return { regions, matrix, matrixType: 'FC' };
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
            volume_mm3: Number(region.volume_mm3) || 0,
            system: this.inferSystem(region),
            network: this.mapRegionToYeoNetwork(region, index),
            legacyNetwork: this.inferNetwork(region, index),
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

    getVisibleIndices(networkSet = this.activeNetworks, networkField = 'legacyNetwork') {
        if (!this.data) return [];
        return this.data.regions
            .map((region, index) => ({ region, index }))
            .filter((item) => networkSet.has(item.region[networkField]))
            .map((item) => item.index);
    }

    getVisibleEdges(threshold, density = 1, networkSet = this.activeNetworks, networkField = 'legacyNetwork') {
        const indices = this.getVisibleIndices(networkSet, networkField);
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
        if (this.networkRenderer) {
            try { this.networkRenderer.dispose(); } catch (e) { /* ignore */ }
            this.networkRenderer = null;
        }
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
        const indices = this.getVisibleIndices(this.topologyActiveNetworks, 'network');
        const edges = this.getVisibleEdges(threshold, 0.08, this.topologyActiveNetworks, 'network');
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
        if (window.BallStickNetworkRenderer && window.THREE) {
            this.renderTopologyThree(viewer, indices, edges, degree, maxDegree);
            const meta = document.getElementById('topologyMeta');
            if (meta) {
                meta.textContent = `${this.yeoTemplate === 'yeo17' ? 'Yeo17' : 'Yeo7'} · ${indices.length} 个节点 · ${edges.length} 条圆柱连接 · 已显示 ${this.topologyActiveNetworks.size}/${this.getYeoNetworks().length} 个网络分组`;
            }
            this.updateExplanation();
            return;
        }

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
            meta.textContent = `${this.yeoTemplate === 'yeo17' ? 'Yeo17' : 'Yeo7'} · ${indices.length} 个脑区质心节点 · ${edges.length} 条功能连接 · 已显示 ${this.topologyActiveNetworks.size}/${this.getYeoNetworks().length} 个网络分组`;
        }
        this.updateExplanation();
    }

    hideSourceMeshes(viewer) {
        (viewer?.meshRegistry || []).forEach((mesh) => {
            mesh.visible = false;
            mesh.opacity = 0;
        });
        (viewer?.nv?.meshes || []).forEach((mesh) => {
            mesh.visible = false;
            mesh.opacity = 0;
        });
        if (viewer?.canvas) {
            viewer.canvas.style.setProperty('display', 'none', 'important');
            viewer.canvas.style.setProperty('visibility', 'hidden', 'important');
            viewer.canvas.style.pointerEvents = 'none';
        }
    }

    refreshTopologyStyles() {
        if (!this.networkRenderer || !this.data) {
            this.renderTopology();
            return;
        }
        const nodes = this.data.regions.map((region, index) => ({
            index,
            network: region.network,
            color: this.getNetworkDefinition(region.network).color,
            centroid: this.networkRenderer.getSurfaceCentroid(region.id) || region.centroid,
        }));
        const edges = this.networkRenderer.edgeObjects.map((mesh) => {
            const edge = mesh.userData.edge;
            const source = this.data.regions[edge.source];
            const target = this.data.regions[edge.target];
            return {
                ...edge,
                sourceNetwork: source.network,
                targetNetwork: target.network,
                network: source.network,
                color: this.getNetworkDefinition(source.network).color,
                opacity: source.network === target.network ? 0.62 : 0.18,
            };
        });
        this.networkRenderer.updateNetworkStyles(nodes, edges);
    }

    renderTopologyThree(viewer, indices, edges, degree, maxDegree) {
        const container = document.getElementById('functionalTopologyStage');
        if (!container) return;
        const overlay = document.getElementById('topologyHitOverlay');
        if (overlay) overlay.style.display = 'none';
        if (viewer.canvas) {
            viewer.canvas.style.setProperty('display', 'none', 'important');
            viewer.canvas.style.setProperty('visibility', 'hidden', 'important');
            viewer.canvas.style.pointerEvents = 'none';
        }

        if (!this.networkRenderer) {
            this.networkRenderer = new BallStickNetworkRenderer(container, {
                radiusMin: 0.15,
                radiusMax: 1.2,
                nodeRadius: 1.9,
                collisionScale: 2.8,
                onSelect: (userData) => this.handleNetworkSelection(userData, viewer),
            });
        }
        // 源 NiiVue 彩色脑区网格只作为几何数据来源，渲染时彻底隐藏，
        // 避免缩放/旋转后出现固定不动的彩色脑体残影。
        this.hideSourceMeshes(viewer);
        this.networkRenderer.setBrainMeshes(viewer.meshRegistry || []);
        this.networkRenderer.setBrainOpacity(this.brainOpacity);
        const nodes = indices.map((index, localIndex) => {
            const region = this.data.regions[index];
            return {
                index,
                id: region.id,
                name: region.name,
                network: region.network,
                color: this.getNetworkDefinition(region.network).color,
                centroid: this.networkRenderer?.getSurfaceCentroid?.(region.id) || region.centroid,
                degree: degree[localIndex] || 0,
            };
        });
        const edgesWithStyle = edges.map((edge) => {
            const source = this.data.regions[edge.source];
            const target = this.data.regions[edge.target];
            const same = source.network === target.network;
            return {
                ...edge,
                type: 'FC',
                sourceNetwork: source.network,
                targetNetwork: target.network,
                color: this.getNetworkDefinition(source.network).color,
                opacity: same ? 0.62 : 0.18,
            };
        });
        this.networkRenderer.setNetworkData(nodes, edgesWithStyle);
        this.networkRenderer.setSelection(this.topologySelection);
        this.networkRenderer.setOnlySelected(this.onlySelectedTopology);
        this.networkRenderer.setFocusNetwork(this.focusedNetwork);
        this.networkRenderer.setPickingLocked(this.topologyAllMode && !this.onlySelectedTopology && !this.topologySelection);
    }

    handleNetworkSelection(userData, viewer) {
        if (!userData || !this.data) return;
        this.clearTopologyHighlightState();
        if (userData.kind === 'node') {
            this.networkRenderer?.setPickingLocked(false);
            this.topologySelection = { type: 'node', index: Number(userData.index) };
            this.networkRenderer.setRoiHighlight([this.data.regions[userData.index].id]);
            viewer.setFunctionalHighlightIds([this.data.regions[userData.index].id]);
        } else if (userData.kind === 'edge') {
            const edge = userData.edge;
            this.topologySelection = { ...edge, type: 'edge', connectionType: edge.type || 'FC' };
            const regionIds = [this.data.regions[edge.source].id, this.data.regions[edge.target].id];
            this.networkRenderer.setRoiHighlight(regionIds);
            viewer.setFunctionalHighlightIds(regionIds);
            this.onlySelectedTopology = true;
            this.topologyAllMode = false;
            this.networkRenderer.setOnlySelected(true);
            this.networkRenderer.setPickingLocked(true);
        }
        this.networkRenderer.setSelection(this.topologySelection);
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
        const panel = document.getElementById('module2');
        if (!panel?.classList.contains('active')) return;
        cancelAnimationFrame(this._overlayFrame);
        this._overlayFrame = requestAnimationFrame(() => {
            const viewer = this.brainViewers.topology;
            const svg = document.getElementById('topologyHitOverlay');
            if (
                viewer
                && this.topologyData
                && svg
                && svg.clientWidth > 1
                && svg.clientHeight > 1
            ) {
                this.renderTopologyOverlay(viewer);
            }
        });
    }

    renderTopologyOverlay(viewer) {
        const svg = document.getElementById('topologyHitOverlay');
        if (!svg || !this.topologyData) return;
        const { indices, edges } = this.topologyData;
        const width = svg.clientWidth || viewer.canvas.clientWidth;
        const height = svg.clientHeight || viewer.canvas.clientHeight;
        if (width < 2 || height < 2) return;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.innerHTML = '';

        const points = viewer.projectFunctionalPoints(indices.map((index) => this.data.regions[index].centroid));
        if (points.some((point) =>
            !Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)
        )) {
            return;
        }
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
            if (projectedCurve.some((point) =>
                !Number.isFinite(point.x) || !Number.isFinite(point.y)
            )) {
                return;
            }
            this.topologyData.hitEdges.push({ edge, points: projectedCurve });
            const pathData = projectedCurve.map((point, index) =>
                `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
            const strength = Math.abs(edge.value);
            const sourceNetwork = this.data.regions[edge.source].network;
            const targetNetwork = this.data.regions[edge.target].network;
            const sameNetwork = sourceNetwork === targetNetwork;
            const sourceDef = this.getNetworkDefinition(sourceNetwork);
            const inFocus = !this.focusedNetwork || sourceNetwork === this.focusedNetwork || targetNetwork === this.focusedNetwork;
            const focusFactor = inFocus ? 1 : 0.18;
            svg.appendChild(make('path', {
                d: pathData,
                class: 'topology-visible-edge',
                stroke: sourceDef.color,
                'stroke-width': String(0.35 + Math.pow(strength, 2) * 4.2),
                'stroke-opacity': String((sameNetwork
                    ? 0.16 + strength * 0.28
                    : 0.06 + strength * 0.12) * focusFactor),
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
            const nodeFocused = !this.focusedNetwork || region.network === this.focusedNetwork;
            svg.appendChild(make('circle', {
                cx: point.x,
                cy: point.y,
                r: String(2.1 + Math.sqrt(Math.max(0, degree) / maxDegree) * 2.8),
                class: 'topology-visible-node',
                fill: this.getNetworkDefinition(region.network).color,
                opacity: nodeFocused ? '1' : '0.22',
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

        const minInput = Number(document.getElementById('heatmapRangeMin')?.value ?? 0.2);
        const maxInput = Number(document.getElementById('heatmapRangeMax')?.value ?? 0.9);
        const rangeMin = Math.max(0, Math.min(1, minInput));
        const rangeMax = Math.max(rangeMin + 0.01, Math.min(1, maxInput));
        const threshold = Number(document.getElementById('heatmapThreshold')?.value || 0) / 100;

        // 四大网络/当前Yeo分组按固定顺序聚集，形成块状连接集群。
        const networkOrder = this.heatmapNetworkFilter
            ? [this.heatmapNetworkFilter]
            : this.getYeoNetworks().map((network) => network.id);
        const indices = [];
        networkOrder.forEach((network) => {
            this.data.regions.forEach((region, index) => {
                if (region.network === network) indices.push(index);
            });
        });

        // 坐标轴显示脑区序号，而不是脑区名称。
        const labels = indices.map((_, index) => String(index + 1));
        const data = [];
        for (let i = 0; i < indices.length; i++) {
            for (let j = 0; j < indices.length; j++) {
                const sourceIndex = indices[i];
                const targetIndex = indices[j];
                const rawValue = i === j ? 1 : this.data.matrix[sourceIndex][targetIndex];
                const displayValue = i === j || Math.abs(rawValue) >= threshold
                    ? Math.max(rangeMin, Math.min(rangeMax, Number(rawValue)))
                    : null;
                data.push([j, i, displayValue, sourceIndex, targetIndex, Number(rawValue)]);
            }
        }

        const groups = [];
        let cursor = 0;
        networkOrder.forEach((network) => {
            const count = indices.filter((index) => this.data.regions[index].network === network).length;
            if (!count) return;
            groups.push({ network, start: cursor, end: cursor + count - 1 });
            cursor += count;
        });

        const markAreaData = groups.map((group) => [
            {
                name: this.getNetworkDefinition(group.network).short,
                xAxis: labels[group.start],
                yAxis: labels[group.start],
                itemStyle: {
                    color: 'transparent',
                    borderColor: this.getNetworkDefinition(group.network).color,
                    borderWidth: 2,
                },
                label: { show: false },
            },
            { xAxis: labels[group.end], yAxis: labels[group.end] },
        ]);

        chart.setOption({
            animation: false,
            title: {
                text: 'Averaged Connectivity',
                left: 'center',
                top: 4,
                textStyle: { color: '#1F2937', fontSize: 15, fontWeight: 600 },
            },
            grid: { left: 58, right: 86, top: 34, bottom: 58 },
            tooltip: {
                formatter: (params) => {
                    const row = this.data.regions[params.value[3]];
                    const column = this.data.regions[params.value[4]];
                    return `<strong>ROI #${indices.indexOf(params.value[3]) + 1}</strong> · ${row.name}<br/>` +
                        `<strong>ROI #${indices.indexOf(params.value[4]) + 1}</strong> · ${column.name}<br/>` +
                        `连接权重 r = ${Number(params.value[5]).toFixed(3)}<br/>` +
                        `${this.getNetworkDefinition(row.network).short} ↔ ${this.getNetworkDefinition(column.network).short}`;
                },
            },
            xAxis: {
                type: 'category',
                data: labels,
                splitArea: { show: true },
                axisLabel: { rotate: 0, fontSize: 8, color: '#475569', interval: labels.length > 80 ? 9 : 0 },
                name: '脑区序号',
                nameLocation: 'middle',
                nameGap: 30,
            },
            yAxis: {
                type: 'category',
                data: labels,
                splitArea: { show: true },
                axisLabel: { fontSize: 8, color: '#475569', interval: labels.length > 80 ? 9 : 0 },
                name: '脑区序号',
                nameLocation: 'middle',
                nameGap: 42,
                inverse: true,
            },
            visualMap: {
                min: rangeMin,
                max: rangeMax,
                calculable: true,
                orient: 'vertical',
                right: 8,
                top: 'center',
                itemHeight: 180,
                text: [String(rangeMax), String(rangeMin)],
                textStyle: { color: '#64748B', fontSize: 10 },
                inRange: {
                    color: ['#08306B', '#2166AC', '#00BFC4', '#FDE725', '#F58220', '#7F0000'],
                },
            },
            dataZoom: [
                { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
                { type: 'inside', yAxisIndex: 0, filterMode: 'none' },
                { type: 'slider', xAxisIndex: 0, height: 16, bottom: 12 },
            ],
            series: [{
                type: 'heatmap',
                data,
                itemStyle: { borderColor: 'rgba(255,255,255,0.68)', borderWidth: 0.7 },
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
            meta.textContent = `${indices.length} × ${indices.length} · 按网络分组排序 · 色标 ${rangeMin.toFixed(2)}–${rangeMax.toFixed(2)} · 点击方格联动三维拓扑图`;
        }
        this.updateExplanation();
    }

    updateExplanation() {
        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };
        const titles = {
            topology: '三维脑模型拓扑连接图',
            activation: '激活图（统计参数图）',
            heatmap: 'Averaged Connectivity',
            chord: '功能连接弦图',
        };
        setText('funcInfoTitle', titles[this.currentView] || '功能网络可视化');

        let networkText = '—';
        let regionText = '—';
        let targetText = '—';
        let valueText = '—';
        let interpretation = '点击节点、连线或热力图方格查看详情。';

        if (this.currentView === 'activation') {
            const network = this.getActivationNetworkDefinition(this.activationNetwork);
            networkText = network.label;
            interpretation = `${network.description} 光标探测仅查询当前网络的激活信息。`;
            if (this.activationProbe?.mni) {
                regionText = `MNI [${this.activationProbe.mni.map((value) => Number(value).toFixed(1)).join(', ')}]`;
                targetText = '当前网络激活探测';
                valueText = `Z = ${Number(this.activationProbe.z || 0).toFixed(2)}`;
            } else {
                regionText = '体素级统计参数图';
                targetText = 'MNI152 标准脑模板';
                valueText = `显示 |Z| ≥ ${Number(document.getElementById('activationThreshold')?.value || 3).toFixed(1)}`;
            }
        } else if (this.currentView === 'topology' && this.topologySelection) {
            const selection = this.topologySelection;
            if (selection.type === 'node') {
                const region = this.data.regions[selection.index];
                const networkDef = this.getNetworkDefinition(region.network);
                networkText = networkDef.label;
                regionText = `${region.name}（${region.code}）`;
                let strength = 0;
                this.getVisibleIndices(this.topologyActiveNetworks, 'network').forEach((index) => {
                    if (index !== selection.index) strength += Math.abs(this.data.matrix[selection.index][index]);
                });
                valueText = `连接强度和 ${strength.toFixed(2)}`;
                interpretation = networkDef.description;
            } else {
                const source = this.data.regions[selection.source];
                const target = this.data.regions[selection.target];
                const sourceDef = this.getNetworkDefinition(source.network);
                const targetDef = this.getNetworkDefinition(target.network);
                networkText = source.network === target.network ? sourceDef.label : `${sourceDef.short} ↔ ${targetDef.short}`;
                regionText = source.name;
                targetText = target.name;
                valueText = `r = ${Number(selection.value).toFixed(3)}`;
                interpretation = `${sourceDef.description} 对端脑区属于${targetDef.label}。`;
            }
        } else if (this.currentView === 'heatmap' && this.heatmapPair) {
            const source = this.data.regions[this.heatmapPair.source];
            const target = this.data.regions[this.heatmapPair.target];
            const sourceDef = this.getNetworkDefinition(source.network);
            const targetDef = this.getNetworkDefinition(target.network);
            networkText = source.network === target.network ? sourceDef.label : `${sourceDef.short} ↔ ${targetDef.short}`;
            regionText = `${source.name}（${source.code}）`;
            targetText = `${target.name}（${target.code}）`;
            valueText = `r = ${Number(this.heatmapPair.value).toFixed(3)}`;
            interpretation = `点击“在三维拓扑图中查看”可定位对应脑区连接。`;
        }

        setText('funcInfoNetwork', networkText);
        setText('funcInfoRegion', regionText);
        setText('funcInfoTarget', targetText);
        setText('funcInfoValue', valueText);
        setText('funcInfoInterpretation', interpretation);
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

        [['axial', '轴位 Axial'], ['sagittal', '矢状位 Sagittal'], ['coronal', '冠状位 Coronal']].forEach(([orientation, label]) => {
            const figure = document.createElement('figure');
            figure.className = 'activation-figure';
            figure.dataset.orientation = orientation;
            layout.appendChild(figure);
            const viewer = new MniSliceViewer(
                figure,
                orientation,
                this.activationNetwork,
                () => viewer.setThreshold(document.getElementById('activationThreshold')?.value || 3),
                this.sharedMni,
                (probe) => {
                    this.activationProbe = probe;
                    if (this.currentView === 'activation') this.updateExplanation();
                },
            );
            this.sliceViewers.push(viewer);
        });

        container.appendChild(layout);
        const meta = document.getElementById('activationMeta');
        if (meta) {
            meta.textContent = `${this.getActivationNetworkDefinition(this.activationNetwork).label} · MNI152 灰度底层 + 体素级 Z 图透明叠加 · 支持独立拖动三层切片`;
        }
    }

    async renderActivation() {
        if (!this.sliceViewers.length) await this.buildActivationCanvasLayout();
        const threshold = Number(document.getElementById('activationThreshold')?.value || 3);
        await Promise.all(this.sliceViewers.map((viewer) => viewer.setNetwork(this.activationNetwork)));
        this.sliceViewers.forEach((viewer) => viewer.setThreshold(threshold));
        const meta = document.getElementById('activationMeta');
        if (meta) {
            meta.textContent = `${this.getActivationNetworkDefinition(this.activationNetwork).label} · MNI152 灰度底层 + 体素级 Z 图透明叠加 · |Z| ≥ ${threshold.toFixed(1)}`;
        }
        this.updateExplanation();
    }

    setHeatmapPair(source, target) {
        if (!this.data) return;
        const value = source === target ? 1 : this.data.matrix[source][target];
        this.heatmapPair = { source, target, value };
        this.topologySelection = { type: 'edge', source, target, value };
        const ids = [this.data.regions[source].id, this.data.regions[target].id];
        this.networkRenderer?.setSelection(this.topologySelection);
        this.networkRenderer?.setRoiHighlight(ids);
        this.brainViewers.topology?.setFunctionalHighlightIds(ids);
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
        const panel = document.getElementById('module2');
        if (!panel?.classList.contains('active')) return;
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
            rows.push([region.name, FUNCTIONAL_NETWORKS[region.legacyNetwork].label, ...Array.from(this.data.matrix[index], (value) => value.toFixed(4))]);
        });
        return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    }
}

window.FunctionalNetworkManager = FunctionalNetworkManager;
window.FUNCTIONAL_ATLASES = FUNCTIONAL_ATLASES;
