/* =====================================================================
 * NeuroViz 白质连接模块
 * ---------------------------------------------------------------------
 * 使用 NiiVue 的纤维束网格能力加载 TRX/TRK/TCK。
 * 演示数据为 Yeh 等公开群体纤维束图集，并已按主要纤维束分组。
 * 该数据用于界面演示与教学，不构成个体临床诊断结论。
 * ===================================================================== */

const WHITE_MATTER_DATASET = {
    url: './data/tracts/yeh2022.trx',
    name: 'yeh2022.trx',
    citation: 'Yeh et al., PMID: 35995773',
};

const WHITE_MATTER_TRACTS = {
    overview: {
        label: '主要纤维束（分类着色）',
        description: '按解剖类别显示白质纤维束；不同颜色代表不同纤维通路。',
    },
    all: {
        label: '全脑纤维流线（方向着色）',
        description: '显示图集内全部流线。红、绿、蓝分别表示左右、前后、上下方向。',
    },
    arcuate: {
        label: '弓状束 Arcuate Fasciculus',
        short: '弓状束',
        groups: ['AF_L', 'AF_R'],
        color: [255, 107, 107],
        streamlineCount: 782,
        description: '连接额叶与颞叶语言相关区域，是语言网络的重要白质通路。',
    },
    cingulum: {
        label: '扣带束 Cingulum Bundle',
        short: '扣带束',
        groups: ['CB_L', 'CB_R'],
        color: [78, 205, 196],
        streamlineCount: 1217,
        description: '沿扣带皮层走行，参与边缘系统、情绪、记忆和认知加工。',
    },
    cst: {
        label: '皮质脊髓束 Corticospinal Tract',
        short: '皮质脊髓束',
        groups: ['CST_L', 'CST_R'],
        color: [255, 230, 109],
        streamlineCount: 208,
        description: '从运动皮层下行至脑干和脊髓，参与随意运动的传出控制。',
    },
    ilf: {
        label: '下纵束 Inferior Longitudinal Fasciculus',
        short: '下纵束',
        groups: ['ILF_L', 'ILF_R'],
        color: [123, 223, 242],
        streamlineCount: 1343,
        description: '连接枕叶与颞叶，参与视觉识别、视觉记忆和语义加工。',
    },
    slf: {
        label: '上纵束 Superior Longitudinal Fasciculus',
        short: '上纵束',
        groups: ['SLF1_L', 'SLF1_R', 'SLF2_L', 'SLF2_R', 'SLF3_L', 'SLF3_R'],
        color: [255, 139, 148],
        streamlineCount: 1672,
        description: '连接额叶、顶叶与颞叶，参与语言、空间注意和感觉运动整合。',
    },
    uncinate: {
        label: '钩束 Uncinate Fasciculus',
        short: '钩束',
        groups: ['UF_L', 'UF_R'],
        color: [179, 136, 255],
        streamlineCount: 384,
        description: '连接眶额叶与前颞叶，参与情绪、奖赏和情景记忆。',
    },
    corpusCallosum: {
        label: '胼胝体 Corpus Callosum',
        short: '胼胝体',
        groups: ['CC'],
        color: [245, 176, 65],
        streamlineCount: 2477,
        description: '跨越大脑纵裂，连接左右半球；不同部分参与感觉、运动和认知信息交换。',
    },
    ifof: {
        label: '额枕下束 Inferior Fronto-Occipital Fasciculus',
        short: '额枕下束',
        groups: ['IFOF_L', 'IFOF_R'],
        color: [165, 214, 167],
        streamlineCount: 1412,
        description: '连接枕顶区域与额叶，参与视觉、注意和语义网络之间的信息传递。',
    },
};

const WHITE_MATTER_NETWORKS = {
    smn: { label: '感觉运动网络 SMN', color: [139, 92, 246] },
    dmn: { label: '默认模式网络 DMN', color: [37, 99, 235] },
    attention: { label: '注意网络', color: [16, 185, 129] },
    ecn: { label: '执行控制网络 ECN', color: [239, 68, 68] },
};

class WhiteMatterManager {
    constructor(options = {}) {
        this.onToast = options.onToast || (() => {});
        this.containerId = options.containerId || 'viewer3D3';
        this.dataBase = options.dataBase || './data/';
        this.ready = false;
        this.isCustomTract = false;
        this.currentTract = 'overview';
        this.currentNetwork = 'smn';
        this.viewMode = '3d';
        this.matrixFilter = 'all';
        this.matrixRegionCount = 16;
        this.functionalOverlayEnabled = false;
        this.cortexShellEnabled = true;
        this.structuralConnectivity = null;
        this.matrixChart = null;
        this._initPromise = null;
        this._customTractData = null;
        this._demoTractData = null;
        this.threeViewer = null;
    }

    init() {
        if (!this._initPromise) {
            this._initPromise = this._initialize().catch((error) => {
                this._initPromise = null;
                this._hideBusy();
                this._showFailure(error);
                throw error;
            });
        }
        return this._initPromise;
    }

    async _initialize() {
        const container = document.getElementById(this.containerId);
        if (!container) throw new Error(`找不到白质连接视窗：${this.containerId}`);

        container.querySelectorAll('canvas, .niivue-stub-note').forEach((node) => node.remove());
        this.container = container;
        container.style.position = 'relative';

        this._showBusy('正在加载 Three.js 科研渲染器…');
        this._bindControls();

        const { WhiteMatterThreeViewer } = await import('./white-matter-three.js?v=100');
        if (typeof WhiteMatterThreeViewer !== 'function') {
            throw new Error('Three.js 白质渲染器未加载');
        }

        this._showBusy('正在解析 TRX 纤维束与分组…');
        const tractData = await this._parseTractUrl(
            WHITE_MATTER_DATASET.url,
            WHITE_MATTER_DATASET.name,
        );
        this._demoTractData = tractData;
        this.totalFibers = Math.max(0, tractData.offsets.length - 1);
        this.groupLookup = new Map(
            (tractData.groups || []).map((group, index) => [String(group.id), index])
        );

        const bundleDefinitions = Object.entries(WHITE_MATTER_TRACTS)
            .filter(([id, item]) => id !== 'overview' && id !== 'all' && item.groups)
            .map(([id, item]) => ({
                id,
                groups: item.groups,
                color: item.color,
            }));
        this._showBusy('正在生成管状纤维与玻璃脑…');
        this.threeViewer = new WhiteMatterThreeViewer(container, {
            bundleDefinitions,
            minLength: 50,
            decimationStride: 4,
            fiberRadius: 1.2,
            glassVisible: this.cortexShellEnabled,
            glassUrl: './static/atlas_hcp360/cortex_shell.mz3?v=100',
        });
        await this.threeViewer.init(tractData);
        this.cortexShell = this.threeViewer.glassMesh;

        await Promise.all([
            this._createFunctionalNetworks(),
            this._loadStructuralConnectivity(),
        ]);
        this.ready = true;
        this.selectTract('overview', { initialization: true, silent: true });
        this._applyFunctionalOverlay();
        this._hideBusy();
        this._refreshRenderStatus();
        this.windowResizeHandler = () => this.resize();
        window.addEventListener('resize', this.windowResizeHandler);
        return this;
    }

    _bindControls() {
        if (this._controlsBound) return;
        this._controlsBound = true;

        this.tractSelect = document.getElementById('tractSelect');
        this.tractSelect?.addEventListener('change', () => {
            if (!this.isCustomTract) this.selectTract(this.tractSelect.value);
        });

        const radius = document.getElementById('fiberRadius');
        const radiusValue = document.getElementById('fiberRadiusValue');
        radius?.addEventListener('input', () => {
            const value = Number(radius.value) / 10;
            if (radiusValue) radiusValue.textContent = `${value.toFixed(1)} px`;
            this._setTractProperty('fiberRadius', value);
        });

        const density = document.getElementById('fiberDensity');
        density?.addEventListener('change', async () => {
            const stride = Number(density.value) || 1;
            await this._setFiberFilters({ decimationStride: stride });
        });

        const minLength = document.getElementById('fiberMinLength');
        const minLengthValue = document.getElementById('fiberMinLengthValue');
        minLength?.addEventListener('input', () => {
            if (minLengthValue) minLengthValue.textContent = `≥${minLength.value} mm`;
        });
        minLength?.addEventListener('change', async () => {
            await this._setFiberFilters({ minLength: Number(minLength.value) });
        });

        const networkSelect = document.getElementById('functionalOverlaySelect');
        networkSelect?.addEventListener('change', () => {
            this.currentNetwork = networkSelect.value;
            this._applyFunctionalOverlay();
        });

        const overlayToggle = document.getElementById('toggleFuncOverlay');
        overlayToggle?.addEventListener('change', () => {
            this.functionalOverlayEnabled = overlayToggle.checked;
            this._applyFunctionalOverlay();
        });

        const shellToggle = document.getElementById('toggleCortexShell');
        shellToggle?.addEventListener('change', () => {
            this.cortexShellEnabled = shellToggle.checked;
            this.threeViewer?.setGlassBrainVisible(this.cortexShellEnabled);
        });

        document.querySelectorAll('[data-white-view]').forEach((button) => {
            button.addEventListener('click', () => {
                this.setViewMode(button.dataset.whiteView);
            });
        });

        this.matrixFilterSelect = document.getElementById('structuralMatrixFilter');
        this.matrixFilterSelect?.addEventListener('change', () => {
            const value = this.matrixFilterSelect.value;
            this.selectTract(value === 'all' ? 'overview' : value);
        });

        const matrixRegionCount = document.getElementById('structuralMatrixRegionCount');
        const matrixRegionCountValue = document.getElementById('structuralMatrixRegionCountValue');
        matrixRegionCount?.addEventListener('input', () => {
            this.matrixRegionCount = Number(matrixRegionCount.value);
            if (matrixRegionCountValue) {
                matrixRegionCountValue.textContent = String(this.matrixRegionCount);
            }
            this.renderStructuralMatrix();
        });

        document.querySelectorAll('.tract-card').forEach((card) => {
            card.addEventListener('click', () => {
                if (this.isCustomTract) {
                    this.onToast('请先恢复演示数据，再按纤维束筛选', 'info');
                    return;
                }
                this.selectTract(card.dataset.tract);
            });
        });

        const importButton = document.getElementById('btnImportTract');
        const fileInput = document.getElementById('tractFileInput');
        importButton?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            fileInput.value = '';
            if (file) this.loadLocalTract(file);
        });

        document.getElementById('btnRestoreDemoTracts')?.addEventListener('click', () => {
            this.restoreDemoTracts();
        });
        document.getElementById('btnResetView3')?.addEventListener('click', () => {
            this.resetView();
        });
    }

    selectTract(tractId, options = {}) {
        if (!this.ready && !options.initialization) return;
        const config = WHITE_MATTER_TRACTS[tractId];
        if (!config) return;

        this.currentTract = tractId;
        if (this.tractSelect && this.tractSelect.value !== tractId) this.tractSelect.value = tractId;
        this.threeViewer?.setActiveTract(tractId);
        this._setDirectionLegend(true);

        if (tractId === 'all') {
            this._showTractInfo({
                label: config.label,
                description: config.description,
                stats: '全部长纤维 · 标准方向色：红=左右，绿=前后，蓝=上下',
                color: [220, 230, 255],
            });
        } else if (tractId === 'overview') {
            this._showTractInfo({
                label: config.label,
                description: config.description,
                stats: `8 类主要纤维束 · ${this._sumCategoryStreamlines()} 条原始流线`,
                color: [180, 220, 255],
            });
        } else {
            this._showTractInfo({
                label: config.label,
                description: config.description,
                stats: `${config.streamlineCount.toLocaleString()} 条原始流线 · 选中通路增亮，其余纤维减弱`,
                color: config.color,
            });
        }

        document.querySelectorAll('.tract-card').forEach((card) => {
            card.classList.toggle('highlighted', card.dataset.tract === tractId);
        });
        if (this.viewMode === 'matrix') {
            this.matrixFilter = ['overview', 'all'].includes(tractId) ? 'all' : tractId;
            if (this.matrixFilterSelect) this.matrixFilterSelect.value = this.matrixFilter;
            this.renderStructuralMatrix();
        }
        this._refreshRenderStatus();
    }

    _sumCategoryStreamlines() {
        return Object.values(WHITE_MATTER_TRACTS)
            .filter((item) => item.groups)
            .reduce((sum, item) => sum + (item.streamlineCount || 0), 0)
            .toLocaleString();
    }

    _showTractInfo({ label, description, stats, color }) {
        const title = document.getElementById('whiteMatterSelectionTitle');
        const text = document.getElementById('whiteMatterSelectionDescription');
        const stat = document.getElementById('whiteMatterSelectionStats');
        const swatch = document.getElementById('whiteMatterSelectionSwatch');
        if (title) title.textContent = label;
        if (text) text.textContent = description;
        if (stat) stat.textContent = stats;
        if (swatch && color) swatch.style.background = `rgb(${color.join(',')})`;
    }

    _setTractProperty(key, value) {
        if (key === 'fiberRadius') {
            this.threeViewer?.setFiberRadius(value);
        }
    }

    async _setFiberFilters(update) {
        if (!this.threeViewer) return;
        this._showBusy('正在重建纤维管并过滤短流线…');
        try {
            const stats = await this.threeViewer.setFiberFilter(update);
            this._setStatus(
                `显示 ${stats.visibleStreamlines.toLocaleString()} 条 · `
                + `过滤短于 ${stats.minLength} mm 的流线`
            );
        } catch (error) {
            console.error('[WhiteMatter] 纤维过滤失败:', error);
            this.onToast('纤维过滤失败', 'error');
        } finally {
            this._hideBusy();
        }
    }

    _refreshRenderStatus() {
        if (!this.threeViewer) return;
        const stats = this.threeViewer.getStats();
        this._setStatus(
            `显示 ${stats.visibleStreamlines.toLocaleString()} 条 · `
            + `${stats.decimationStride === 1 ? '100%' : `${100 / stats.decimationStride}%`} 采样 · `
            + `短流线阈值 ${stats.minLength} mm`
        );
    }

    async _parseTractUrl(url, name) {
        const parserCanvas = document.createElement('canvas');
        parserCanvas.width = 1;
        parserCanvas.height = 1;
        const gl = parserCanvas.getContext('webgl2', {
            antialias: false,
            alpha: false,
            powerPreference: 'low-power',
        });
        if (!gl) throw new Error('浏览器无法创建纤维束解析上下文');
        try {
            const mesh = await niivue.NVMesh.loadFromUrl({
                url,
                name,
                gl,
            });
            if (!mesh?.pts || !mesh?.offsetPt0) {
                throw new Error('纤维束文件没有可用的流线数据');
            }
            return {
                points: mesh.pts,
                offsets: mesh.offsetPt0,
                groups: mesh.groups || [],
            };
        } finally {
            try {
                gl.getExtension('WEBGL_lose_context')?.loseContext();
            } catch (error) { /* ignore */ }
        }
    }

    _applyFunctionalOverlay() {
        this.threeViewer?.setFunctionalOverlay(
            this.functionalOverlayEnabled ? this.currentNetwork : null
        );

        const status = document.getElementById('functionalOverlayStatus');
        if (status) {
            status.textContent = this.functionalOverlayEnabled
                ? `叠加：${WHITE_MATTER_NETWORKS[this.currentNetwork].label}（演示连接组）`
                : '功能网络叠加已关闭';
        }
    }

    async _createFunctionalNetworks() {
        const response = await fetch(`${this.dataBase}atlas_hcp360.json?v=90`);
        if (!response.ok) throw new Error(`功能网络分区数据加载失败：HTTP ${response.status}`);
        const atlas = await response.json();
        this.atlasRegions = (atlas.regions || []).filter((region) =>
            Array.isArray(region.centroid_mm)
            && region.centroid_mm.length === 3
            && region.centroid_mm.every(Number.isFinite)
        );
        if (!this.atlasRegions.length) throw new Error('功能网络分区缺少脑区质心');

        const patterns = {
            smn: /中央前|中央后|辅助运动|旁中央|感觉运动|precentral|postcentral|paracentral|somatomotor|supplementary/i,
            dmn: /楔前|后扣带|内侧前额|前额内侧|顶下|角回|外侧颞|海马旁|precuneus|posterior_cingulate|medial_prefrontal|inferior_parietal|angular|temporal_pole|parahippoc/i,
            attention: /顶内|额眼|上顶|背侧注意|intraparietal|frontal_eye|superior_parietal|dorsal_attention/i,
            ecn: /额下|额中|背外侧|前扣带|岛盖|执行控制|inferior_frontal|middle_frontal|dorsolateral|anterior_cingulate|opercul/i,
        };

        this.functionalNetworks = {};
        let networkIndex = 0;
        for (const [networkId, network] of Object.entries(WHITE_MATTER_NETWORKS)) {
            const matched = this.atlasRegions.filter((region) => {
                const text = `${region.name_zh || ''} ${region.name_en || ''}`;
                return patterns[networkId]?.test(text);
            });
            const source = matched.length >= 10 ? matched : this.atlasRegions;
            const regions = this._sampleEvenly(source, 18);
            const count = regions.length;
            const matrix = Array.from({ length: count }, () => new Array(count).fill(0));
            let edgeCount = 0;
            for (let i = 0; i < count; i++) {
                for (let j = i + 1; j < count; j++) {
                    const connect = j === i + 1 || ((i * 19 + j * 11 + networkIndex * 7) % 5 === 0);
                    if (!connect) continue;
                    const value = 0.28 + ((i * 17 + j * 23 + networkIndex * 13) % 61) / 100;
                    matrix[i][j] = value;
                    matrix[j][i] = value;
                    edgeCount++;
                }
            }

            const nodes = regions.map((region) => [
                Number(region.centroid_mm[0]),
                Number(region.centroid_mm[1]),
                Number(region.centroid_mm[2]),
            ]);
            const edges = [];
            for (let i = 0; i < count; i++) {
                for (let j = i + 1; j < count; j++) {
                    if (matrix[i][j] > 0) edges.push([i, j, matrix[i][j]]);
                }
            }
            this.functionalNetworks[networkId] = { nodes, edges, edgeCount };
            this.threeViewer.setFunctionalNetwork(
                networkId,
                nodes,
                edges,
                network.color,
            );
            networkIndex++;
        }
    }

    _sampleEvenly(items, limit) {
        if (items.length <= limit) return items.slice();
        const step = items.length / limit;
        return Array.from({ length: limit }, (_, index) => items[Math.floor(index * step)]);
    }

    setViewMode(mode) {
        if (!['3d', 'matrix'].includes(mode)) return;
        this.viewMode = mode;
        document.querySelectorAll('[data-white-view]').forEach((button) => {
            button.classList.toggle('active', button.dataset.whiteView === mode);
        });
        const matrixView = document.getElementById('whiteMatrixView');
        const viewTitle = document.getElementById('whiteViewTitle');
        const toolbar = document.querySelector('.white-matter-toolbar');
        const statusRow = document.querySelector('.white-matter-status-row');
        const threeDimensionalControls = document.querySelector('#module3 .white-3d-only');
        const moduleGrid = document.querySelector('#module3 .module-grid-white');
        const sidePanel = document.querySelector('#module3 .panel-side');
        if (this.container) this.container.hidden = mode !== '3d';
        if (matrixView) matrixView.hidden = mode !== 'matrix';
        if (toolbar) toolbar.hidden = mode !== '3d';
        if (statusRow) statusRow.hidden = mode !== '3d';
        if (threeDimensionalControls) threeDimensionalControls.hidden = mode !== '3d';
        if (moduleGrid) moduleGrid.classList.toggle('matrix-mode', mode === 'matrix');
        if (sidePanel) sidePanel.hidden = mode === 'matrix';
        if (viewTitle) {
            viewTitle.textContent = mode === 'matrix'
                ? '白质结构连接矩阵'
                : 'DTI 纤维束科研渲染';
        }

        if (mode === 'matrix') {
            if (this.matrixFilterSelect) {
                this.matrixFilter = ['overview', 'all'].includes(this.currentTract)
                    ? 'all'
                    : this.currentTract;
                this.matrixFilterSelect.value = this.matrixFilter;
            }
            requestAnimationFrame(() => this.renderStructuralMatrix());
        } else {
            this.resize();
        }
    }

    async _loadStructuralConnectivity() {
        try {
            const response = await fetch(`${this.dataBase}structural_connectivity.json?v=100`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.structuralConnectivity = await response.json();
            if (this.viewMode === 'matrix') {
                requestAnimationFrame(() => this.renderStructuralMatrix());
            }
        } catch (error) {
            console.error('[WhiteMatter] 结构连接矩阵加载失败:', error);
            const status = document.getElementById('structuralMatrixStatus');
            if (status) status.textContent = `结构连接矩阵加载失败：${error.message || error}`;
        }
    }

    _matrixForScope(scope) {
        const data = this.structuralConnectivity;
        if (!data) return null;
        const size = data.regions.length;
        const matrix = Array.from({ length: size }, () => new Uint32Array(size));

        if (scope === 'all') {
            for (let row = 0; row < size; row++) {
                for (let column = 0; column < size; column++) {
                    matrix[row][column] = Number(data.matrix[row]?.[column] || 0);
                }
            }
            return {
                matrix,
                label: '全部主要纤维束',
                streamlines: data.summary.selectedStreamlines,
                mappedStreamlines: data.summary.mappedStreamlines,
            };
        }

        const bundle = data.bundles[scope];
        if (!bundle) return null;
        for (const [source, target, count] of bundle.edges) {
            matrix[source][target] = count;
            matrix[target][source] = count;
        }
        return {
            matrix,
            label: WHITE_MATTER_TRACTS[scope]?.label || scope,
            streamlines: bundle.streamlines,
            mappedStreamlines: bundle.mappedStreamlines,
        };
    }

    renderStructuralMatrix() {
        const data = this.structuralConnectivity;
        const chartContainer = document.getElementById('structuralMatrixChart');
        const status = document.getElementById('structuralMatrixStatus');
        if (!data || !chartContainer) {
            if (status) status.textContent = '结构连接矩阵尚未生成';
            return;
        }
        if (chartContainer.clientWidth < 10 || chartContainer.clientHeight < 10) {
            requestAnimationFrame(() => this.renderStructuralMatrix());
            return;
        }

        const scopeData = this._matrixForScope(this.matrixFilter);
        if (!scopeData) {
            if (status) status.textContent = '当前纤维束没有可用的结构连接数据';
            return;
        }

        const regions = data.regions;
        const size = regions.length;
        const degree = new Float64Array(size);
        const allEdges = [];
        for (let row = 0; row < size; row++) {
            for (let column = row + 1; column < size; column++) {
                const value = scopeData.matrix[row][column];
                if (value <= 0) continue;
                degree[row] += value;
                degree[column] += value;
                allEdges.push({ source: row, target: column, value });
            }
        }
        allEdges.sort((a, b) => b.value - a.value);

        const selectedIndices = Array.from({ length: size }, (_, index) => index)
            .filter((index) => degree[index] > 0)
            .sort((a, b) => degree[b] - degree[a])
            .slice(0, this.matrixRegionCount);
        const selectedSet = new Set(selectedIndices);
        const labels = selectedIndices.map((index) => regions[index].name);
        const shortLabel = (label) => label.length > 12 ? `${label.slice(0, 12)}…` : label;
        const chartValues = [];
        for (let row = 0; row < selectedIndices.length; row++) {
            for (let column = 0; column < selectedIndices.length; column++) {
                const value = scopeData.matrix[selectedIndices[row]][selectedIndices[column]];
                if (value > 0) chartValues.push([column, row, value]);
            }
        }

        const visibleEdges = allEdges.filter((edge) =>
            selectedSet.has(edge.source) && selectedSet.has(edge.target)
        );
        const sortedValues = visibleEdges.map((edge) => edge.value).sort((a, b) => a - b);
        const visualMax = sortedValues.length
            ? Math.max(5, sortedValues[Math.floor((sortedValues.length - 1) * 0.92)])
            : 10;

        this.matrixChart = (!this.matrixChart || this.matrixChart.isDisposed())
            ? echarts.init(chartContainer, null, {
                renderer: 'canvas',
                devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
            })
            : this.matrixChart;

        this.matrixChart.setOption({
            backgroundColor: '#f8fafc',
            animation: true,
            animationDuration: 260,
            textStyle: { fontFamily: 'Arial, "Microsoft YaHei", sans-serif' },
            tooltip: {
                position: 'top',
                formatter: (params) => {
                    const [column, row, value] = params.value;
                    return `<strong>${regions[selectedIndices[row]].name}</strong>`
                        + ` ↔ <strong>${regions[selectedIndices[column]].name}</strong>`
                        + `<br/>映射流线数：${value}`;
                },
            },
            grid: {
                left: 146,
                right: 20,
                top: 34,
                bottom: 66,
                containLabel: false,
            },
            xAxis: {
                type: 'category',
                name: '脑区编号（顺序同纵轴）',
                data: labels.map((_, index) => String(index + 1)),
                nameLocation: 'middle',
                nameGap: 28,
                nameTextStyle: { fontSize: 9, color: '#7b8794' },
                axisLabel: { interval: 0, fontSize: 9, color: '#52606d' },
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#cbd5e1' } },
            },
            yAxis: {
                type: 'category',
                data: labels.map(shortLabel),
                axisLabel: { interval: 0, fontSize: 9, color: '#52606d' },
                axisTick: { show: false },
                axisLine: { lineStyle: { color: '#cbd5e1' } },
            },
            visualMap: {
                min: 1,
                max: visualMax,
                calculable: false,
                orient: 'horizontal',
                left: 'center',
                bottom: 8,
                text: ['强', '弱'],
                textStyle: { fontSize: 9, color: '#64748b' },
                inRange: {
                    color: ['#e7eef7', '#8db8e8', '#3d7fc1', '#f59e0b'],
                },
            },
            series: [{
                name: '结构连接',
                type: 'heatmap',
                data: chartValues,
                progressive: 4000,
                progressiveThreshold: 5000,
                itemStyle: {
                    borderColor: '#f8fafc',
                    borderWidth: 1,
                },
                emphasis: {
                    itemStyle: {
                        borderColor: '#0f172a',
                        borderWidth: 1.5,
                    },
                },
            }],
        }, true);
        this.matrixChart.resize();
        this._renderTopConnections(visibleEdges.slice(0, 6), regions, scopeData);

        if (status) {
            status.innerHTML = ''
                + `<strong>${scopeData.label}</strong><br/>`
                + `${scopeData.mappedStreamlines.toLocaleString()} / `
                + `${scopeData.streamlines.toLocaleString()} 条流线映射成功<br/>`
                + `${allEdges.length} 对脑区连接 · 当前显示连接度最高的 ${selectedIndices.length} 个脑区<br/>`
                + 'AAL116 双侧端点 · 8 mm 邻域 · 原始流线计数';
        }
    }

    _renderTopConnections(edges, regions, scopeData) {
        const container = document.getElementById('structuralTopConnections');
        if (!container) return;
        container.innerHTML = '';
        if (!edges.length) {
            const empty = document.createElement('p');
            empty.className = 'placeholder';
            empty.textContent = '当前纤维束没有可显示的结构连接';
            container.appendChild(empty);
            return;
        }
        for (const edge of edges) {
            const item = document.createElement('div');
            item.className = 'structural-top-item';
            const title = document.createElement('strong');
            title.textContent = `${regions[edge.source].name} ↔ ${regions[edge.target].name}`;
            const count = document.createElement('span');
            count.textContent = `${edge.value} 条流线`;
            const share = document.createElement('em');
            share.textContent = scopeData.mappedStreamlines
                ? `${(edge.value / scopeData.mappedStreamlines * 100).toFixed(1)}%`
                : '';
            item.append(title, count, share);
            container.appendChild(item);
        }
    }

    async loadLocalTract(file) {
        if (!/\.(trx|trk|tck|vtk)$/i.test(file.name)) {
            this.onToast('请选择 .trx、.trk、.tck 或 .vtk 纤维束文件', 'error');
            return;
        }

        this._showBusy(`正在加载本地纤维束：${file.name}`);
        const objectUrl = URL.createObjectURL(file);
        try {
            const tractData = await this._parseTractUrl(objectUrl, file.name);
            this._customTractData = tractData;
            this.threeViewer.minLength = 0;
            this.threeViewer.decimationStride = 1;
            await this.threeViewer.loadTractData(tractData, {
                activeTract: 'all',
                resetActive: true,
            });
            const minLength = document.getElementById('fiberMinLength');
            const minLengthValue = document.getElementById('fiberMinLengthValue');
            const density = document.getElementById('fiberDensity');
            if (minLength) minLength.value = '0';
            if (minLengthValue) minLengthValue.textContent = '≥0 mm';
            if (density) density.value = '1';
            this.totalFibers = Math.max(0, tractData.offsets.length - 1);
            this.groupLookup = new Map(
                (tractData.groups || []).map((group, index) => [String(group.id), index])
            );

            this.isCustomTract = true;
            this._setDirectionLegend(true);
            if (this.tractSelect) this.tractSelect.disabled = true;
            const restore = document.getElementById('btnRestoreDemoTracts');
            if (restore) restore.disabled = false;

            const groupCount = tractData.groups?.length || 0;
            const fiberCount = Math.max(0, tractData.offsets.length - 1);
            this._showTractInfo({
                label: file.name,
                description: '本地纤维束已由 Three.js 重新渲染，使用标准方向色和短流线过滤。文件只在当前浏览器内解析，不会上传到服务器。',
                stats: `${fiberCount.toLocaleString()} 条流线 · ${groupCount} 个纤维组`,
                color: [255, 196, 64],
            });
            this._refreshRenderStatus();
            this.onToast('本地纤维束加载成功', 'success');
        } catch (error) {
            console.error('[WhiteMatter] 本地纤维束加载失败:', error);
            this.onToast(`纤维束加载失败：${error.message || error}`, 'error');
        } finally {
            URL.revokeObjectURL(objectUrl);
            this._hideBusy();
        }
    }

    async restoreDemoTracts() {
        if (!this._demoTractData || !this.threeViewer) return;
        this._showBusy('正在恢复演示纤维束…');
        this.threeViewer.minLength = 50;
        this.threeViewer.decimationStride = 4;
        await this.threeViewer.loadTractData(this._demoTractData, {
            activeTract: 'overview',
            resetActive: true,
        });
        const minLength = document.getElementById('fiberMinLength');
        const minLengthValue = document.getElementById('fiberMinLengthValue');
        const density = document.getElementById('fiberDensity');
        if (minLength) minLength.value = '50';
        if (minLengthValue) minLengthValue.textContent = '≥50 mm';
        if (density) density.value = '4';
        this._customTractData = null;
        this.totalFibers = Math.max(0, this._demoTractData.offsets.length - 1);
        this.groupLookup = new Map(
            (this._demoTractData.groups || []).map((group, index) => [String(group.id), index])
        );
        this.isCustomTract = false;
        if (this.tractSelect) this.tractSelect.disabled = false;
        const restore = document.getElementById('btnRestoreDemoTracts');
        if (restore) restore.disabled = true;
        this.selectTract('overview');
        this._refreshRenderStatus();
        this._hideBusy();
        this.onToast('已恢复演示纤维束', 'success');
    }

    resetView() {
        this.threeViewer?.resetView();
    }

    resize() {
        if (this.viewMode === 'matrix') {
            try { this.matrixChart?.resize(); } catch (error) { /* ignore */ }
            return;
        }
        this.threeViewer?.resize();
    }

    screenshot() {
        if (this.viewMode === 'matrix') {
            try {
                return this.matrixChart.getDataURL({
                    type: 'png',
                    pixelRatio: 2,
                    backgroundColor: '#f8fafc',
                });
            } catch (error) {
                console.error('[WhiteMatter] 矩阵截图失败:', error);
                return '';
            }
        }
        try {
            return this.threeViewer?.screenshot() || '';
        } catch (error) {
            console.error('[WhiteMatter] 截图失败:', error);
            return '';
        }
    }

    _setStatus(message) {
        const status = document.getElementById('whiteMatterStatus');
        if (status) status.textContent = message;
    }

    _setDirectionLegend(visible) {
        const legend = document.getElementById('fiberDirectionLegend');
        if (legend) legend.hidden = !visible;
    }

    _showBusy(message) {
        if (!this.container) return;
        let overlay = document.getElementById('whiteMatterLoading');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'whiteMatterLoading';
            overlay.className = 'white-matter-loading';
            overlay.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span></span>';
            this.container.appendChild(overlay);
        }
        const text = overlay.querySelector('span');
        if (text) text.textContent = message;
        overlay.hidden = false;
    }

    _hideBusy() {
        const overlay = document.getElementById('whiteMatterLoading');
        if (overlay) overlay.hidden = true;
    }

    _showFailure(error) {
        if (!this.container) return;
        this.threeViewer?.dispose?.();
        this.container.querySelectorAll('canvas').forEach((canvas) => canvas.remove());
        this._showBusy(`白质连接模块加载失败：${error.message || error}`);
        this._setStatus('纤维束加载失败，请检查 data/tracts/yeh2022.trx 与网络连接');
        this.onToast('白质连接模块加载失败', 'error');
    }
}

window.WhiteMatterManager = WhiteMatterManager;
