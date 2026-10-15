/* =====================================================================
 * NeuroViz 兼容占位类（模块 2/3/4 迁移期间使用）
 * ---------------------------------------------------------------------
 * 结构分区模块已迁移到 NiiVue；功能网络 / 白质连接 / 交互分析模块
 * 将在后续迁移到 NiiVue。为保证页面不因缺失 BrainViewer/SliceViewer
 * 而崩溃，这里提供最小可用的占位实现。
 * ===================================================================== */

class BrainViewer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = options || {};
        this.brainCenter = { x: 0, y: 0, z: 0 };
        this.subcorticalMeshes = [];
        this.currentAtlas = 'hcp360';
        this._el = document.getElementById(containerId);
        if (this._el && !this._el.querySelector('.niivue-stub-note')) {
            const note = document.createElement('div');
            note.className = 'niivue-stub-note';
            note.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
                'color:var(--text-muted,#888);font-size:13px;text-align:center;padding:20px;pointer-events:none;';
            note.textContent = '该模块正在迁移到 NiiVue 引擎，敬请期待';
            if (getComputedStyle(this._el).position === 'static') this._el.style.position = 'relative';
            this._el.appendChild(note);
        }
    }
    async createFullBrain() { return null; }
    addSubcorticalStructures() {}
    addNetworkOverlay() {}
    removeOverlay() {}
    addActivationOverlay() {}
    generateDemoTracts() {}
    loadTracts() {}
    clearCorticalFocus() {}
    clearSubcorticalFocus() {}
    focusCorticalRegion() {}
    focusSubcorticalRegion() {}
    getSubcorticalPosition() { return { x: 0, y: 0, z: 0 }; }
    getRegionSpatialInfo() { return null; }
    getRegionSpatialCenter() { return null; }
    getRegionVertexCount() { return 0; }
    animateCameraTo() {}
    resetView() {}
    screenshot() { return ''; }
    dispose() {}
}

class SliceViewer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.orientation = 'axial';
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this._drawPlaceholder();
        }
    }
    _drawPlaceholder() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#555';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('切片视图 · 迁移中', w / 2, h / 2);
    }
    setVolume() {}
    setCrosshair() {}
    render() { this._drawPlaceholder(); }
    dispose() {}
}

window.BrainViewer = BrainViewer;
window.SliceViewer = SliceViewer;
