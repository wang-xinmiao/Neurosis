/* =====================================================================
 * NeuroViz NiiVue 三维/多平面 脑影像查看器
 * ---------------------------------------------------------------------
 * 以 NIfTI 标准图谱为数据源，取代旧的 OBJ 模型方案：
 *   - MNI152 T1 模板做底图
 *   - 分区图谱（.nii.gz）作为 labelmap，颜色由 JSON LUT 控制
 *   - 点击高亮 = 直接改 LUT（查找表）→ 从根上解决旧方案的"颜色匹配"问题
 *   - NiiVue 原生提供 轴位/矢状位/冠状位 + 3D 联动视图
 * ===================================================================== */

class NiiVueViewer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.onRegionPick = options.onRegionPick || null; // (info) => void
        this.dataBase = options.dataBase || './data/';
        // viewMode: 'render' = 纯3D脑模型大图（结构分区模块用）
        //           'multiplanar' = 3D+轴位+矢状位+冠状位 四视图（交互分析模块用）
        this.viewMode = options.viewMode || 'render';
        this.atlasMeta = null;        // 当前图谱 JSON（regions/citation...）
        this.subMeta = null;          // 皮层下图谱 JSON
        this.highlight = null;        // {volIndex, id}
        this.hemiFilter = 'both';
        this._pendingClick = false;

        const container = document.getElementById(containerId);
        // 清空容器但保留可能存在的水印
        container.querySelectorAll('canvas').forEach(c => c.remove());
        this.canvas = document.createElement('canvas');
        this.canvas.id = containerId + '-glcanvas';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        container.appendChild(this.canvas);

        const isMP = this.viewMode === 'multiplanar';
        this.nv = new niivue.Niivue({
            // 4 = RENDER（整屏3D）；3 = MULTIPLANAR（3D+三切片四视图）
            sliceType: isMP ? 3 : 4,
            backColor: [0.02, 0.02, 0.06, 1.0],
            // 结构分区纯3D模式：不显示坐标轴/十字线
            show3Dcrosshair: isMP,
            crosshairColor: [0, 188, 212, 255],
            isAxialCrosshairVisible: isMP,
            // 多平面四视图：每个切片窗口角上显示方向/视图名标注
            isCornerOrientationText: isMP,
            isOrientationTextVisible: isMP,
            blendOpacity: 0.9,
            // 分区轮廓描边
            atlasOutline: 2,
            showLegend: false,
        });
        this.nv.attachToCanvas(this.canvas);

        // 多平面模式：在四个窗口角落叠加中文视图名称（覆盖层，不改变布局）
        if (this.viewMode === 'multiplanar') {
            const badges = [
                ['轴位 Axial', 'top:6px;left:8px;'],
                ['矢状位 Sagittal', 'top:6px;right:8px;'],
                ['冠状位 Coronal', 'bottom:6px;left:8px;'],
                ['3D 渲染', 'bottom:6px;right:8px;'],
            ];
            for (const [text, pos] of badges) {
                const b = document.createElement('div');
                b.textContent = text;
                b.style.cssText = 'position:absolute;' + pos +
                    'z-index:4;pointer-events:none;font-size:11px;padding:2px 8px;' +
                    'border-radius:4px;background:rgba(10,10,24,0.65);color:#9be8ff;' +
                    'border:1px solid rgba(0,188,212,0.35);letter-spacing:0.5px;';
                this.canvas.parentElement && this.canvas.parentElement.appendChild(b);
            }
        }

        // 点击 → 通过位置变化事件捕获体素值
        this.canvas.addEventListener('click', () => { this._pendingClick = true; });
        this.nv.onLocationChange = (loc) => this._handleLocation(loc);
    }

    /* ---------------- 数据加载 ---------------- */

    /**
     * 加载一个图谱：底图 + 皮层图谱(+可选皮层下图谱)
     * @param {string} atlasId  如 'hcp360' 'dk68' 'destrieux148' 'aal116' 'yeo7' 'yeo17'
     * @param {boolean} withSub 是否同时叠加皮层下结构图谱
     */
    async loadAtlas(atlasId, withSub = true) {
        this.atlasId = atlasId;
        this.highlight = null;
        this.atlasMeta = await (await fetch(`${this.dataBase}atlas_${atlasId}.json?v=65`)).json();

        // 由 JSON LUT 构建 NiiVue colormapLabel（RGBA 按标签值索引）→ 分区彩色渲染
        const maxId = (this.atlasMeta.regions || []).reduce((m, r) => Math.max(m, r.id), 0);
        const lutLen = maxId + 1;
        const cR = new Float32Array(lutLen), cG = new Float32Array(lutLen),
              cB = new Float32Array(lutLen), cA = new Float32Array(lutLen);
        for (const r of (this.atlasMeta.regions || [])) {
            cR[r.id] = r.color[0]; cG[r.id] = r.color[1];
            cB[r.id] = r.color[2]; cA[r.id] = 255;
        }
        const volumes = [
            { url: `${this.dataBase}MNI152_T1w_1mm.nii.gz?v=65`, name: 't1.nii.gz', colormap: 'gray', opacity: 1.0 },
            { url: `${this.dataBase}atlas_${atlasId}.nii.gz?v=65`, name: `atlas_${atlasId}.nii.gz`,
              colormap: 'gray', opacity: 0.85, colormapLabel: { R: cR, G: cG, B: cB, A: cA } },
        ];
        // AAL 自带皮层下/小脑；其余图谱叠加独立的皮层下图谱
        const hasSubInside = (atlasId === 'aal116');
        this.subIndex = -1;
        if (withSub && !hasSubInside) {
            volumes.push({ url: `${this.dataBase}atlas_subcortical.nii.gz?v=65`, name: 'subcortical.nii.gz', colormap: 'gray', colorMap: 'label', opacity: 0.9 });
            this.subIndex = 2;
        }

        try {
            await this.nv.loadVolumes(volumes);
        } catch (err) {
            console.error('[NiiVueViewer] loadVolumes 失败:', err);
            const box = document.createElement('div');
            box.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
                'background:rgba(120,0,0,0.85);color:#fff;font-size:13px;padding:24px;text-align:center;z-index:5;';
            box.textContent = '数据加载失败: ' + (err && err.message ? err.message : err) +
                ' —— 请截图此信息发给开发者';
            const container = document.getElementById(this.containerId);
            if (container) { container.style.position = 'relative'; container.appendChild(box); }
            throw err;
        }
        this.atlasIndex = 1;

        if (this.subIndex > 0 && !this.subMeta) {
            this.subMeta = await (await fetch(`${this.dataBase}atlas_subcortical.json?v=65`)).json();
        }

        this._applyLUT();
        this.ready = true;
        return this.atlasMeta;
    }

    /* ---------------- LUT（查找表）控制：所有高亮交互的核心 ---------------- */

    _regionList(volIndex) {
        if (volIndex === this.subIndex) return this.subMeta ? this.subMeta.regions : [];
        return this.atlasMeta ? this.atlasMeta.regions : [];
    }

    _isLeft(nameZh, nameEn) { return /^[左L]/.test(nameZh || '') || /^[lL]_/.test(nameEn || ''); }
    _isRight(nameZh, nameEn) { return /^[右R]/.test(nameZh || '') || /^[rR]_/.test(nameEn || ''); }

    /** 根据当前状态重建 LUT 并推送给 NiiVue —— 高亮/半球过滤的唯一入口 */
    _applyLUT() {
        for (const volIndex of [this.atlasIndex, this.subIndex]) {
            if (volIndex < 0 || !this.nv.volumes[volIndex]) continue;
            const regions = this._regionList(volIndex);
            if (!regions.length) continue;
            const maxId = regions.reduce((m, r) => Math.max(m, r.id), 0);
            const lut = new Uint8Array((maxId + 1) * 4);
            for (const r of regions) {
                const [R, G, B] = r.color;
                // 默认：整脑显示分区鲜艳颜色（半透明叠加在 T1 底图上）
                let rr = R, gg = G, bb = B, alpha = 200;
                const left = this._isLeft(r.name_zh, r.name_en);
                const right = this._isRight(r.name_zh, r.name_en);
                // 半球过滤：非目标半球完全隐藏
                if ((this.hemiFilter === 'left' && right) || (this.hemiFilter === 'right' && left)) {
                    alpha = 0;
                }
                if (this.highlight) {
                    if (this.highlight.volIndex === volIndex && r.id === this.highlight.id) {
                        // ===== 选中区域：原始鲜艳颜色 + 完全不透明 =====
                        rr = R; gg = G; bb = B; alpha = 255;
                    } else {
                        // ===== 其余所有脑区：变白 + 高度透明 =====
                        rr = 255; gg = 255; bb = 255; alpha = 45;
                    }
                }
                const i4 = r.id * 4;
                lut[i4 + 0] = rr;
                lut[i4 + 1] = gg;
                lut[i4 + 2] = bb;
                lut[i4 + 3] = alpha;
            }
            const vol = this.nv.volumes[volIndex];
            vol.lut = lut;
            if ('lutSegments' in vol) vol.lutSegments = (maxId + 1);
            try { vol.opacity = volIndex === this.subIndex ? 0.95 : (this.highlight ? 0.85 : 0.6); } catch (e) {}
        }
        try { this.nv.updateGLVolume(); } catch (e) { console.warn('updateGLVolume', e); }
    }

    /** 图例/脚本调用：高亮某个区域（自动判断它属于哪张图谱） */
    setHighlight(regionId) {
        let volIndex = this.atlasIndex, found = null;
        found = (this.atlasMeta?.regions || []).find(r => r.id === regionId);
        if (!found && this.subIndex > 0) {
            const f2 = (this.subMeta?.regions || []).find(r => r.id === regionId);
            if (f2) { found = f2; volIndex = this.subIndex; }
        }
        if (!found) { this.clearHighlight(); return null; }
        this.highlight = { volIndex, id: found.id };
        this._applyLUT();
        // 把十字线移到该区域质心，3D 视角随之聚焦
        try {
            if (found.centroid_mm) {
                this.nv.setCrosshairLocation(found.centroid_mm, null);
            }
        } catch (e) { /* 忽略 */ }
        return found;
    }

    clearHighlight() {
        this.highlight = null;
        this._applyLUT();
    }

    setHemiFilter(mode) { // 'both' | 'left' | 'right'
        this.hemiFilter = mode;
        this._applyLUT();
    }

    /* ---------------- 点击拾取 ---------------- */

    _handleLocation(loc) {
        if (!this._pendingClick) return;
        this._pendingClick = false;
        if (!loc || !loc.values || loc.values.length < 2) return;
        // 依次检查 皮层图谱 → 皮层下图谱
        const checks = [
            { volIndex: this.atlasIndex, meta: this.atlasMeta, value: loc.values[this.atlasIndex] },
        ];
        if (this.subIndex > 0) {
            checks.push({ volIndex: this.subIndex, meta: this.subMeta, value: loc.values[this.subIndex] });
        }
        for (const c of checks) {
            const vid = Math.round(c.value || 0);
            if (vid > 0 && c.meta) {
                const reg = c.meta.regions.find(r => r.id === vid);
                if (reg) {
                    this.highlight = { volIndex: c.volIndex, id: vid };
                    this._applyLUT();
                    if (this.onRegionPick) this.onRegionPick({ ...reg, volumeName: c.meta.name, citation: c.meta.citation });
                    return;
                }
            }
        }
    }

    /* ---------------- 工具方法 ---------------- */

    getRegionInfo(regionId) {
        return (this.atlasMeta?.regions || []).find(r => r.id === regionId)
            || (this.subMeta?.regions || []).find(r => r.id === regionId) || null;
    }

    getAllLegendData() {
        // 供 app.js 构建右侧图例
        return {
            cortical: { name: this.atlasMeta?.name || '', citation: this.atlasMeta?.citation || '', regions: this.atlasMeta?.regions || [] },
            subcortical: { regions: this.subIndex > 0 && this.subMeta ? this.subMeta.regions : [] },
        };
    }

    resetView() {
        try { this.nv.resetDisplayToBaseImage(); } catch (e) {
            try { this.nv.resetView(); } catch (e2) { /* 忽略 */ }
        }
        this.clearHighlight();
    }

    screenshot() {
        try {
            this.nv.saveImage({ filename: 'NeuroViz_' + (this.atlasId || 'screenshot') + '.png', crop: true });
        } catch (e) {
            // 兼容旧 API 签名
            try { this.nv.saveImage('NeuroViz.png', true); } catch (e2) {
                const a = document.createElement('a');
                a.href = this.canvas.toDataURL('image/png');
                a.download = 'NeuroViz.png';
                a.click();
            }
        }
    }
}

// 暴露给普通 script 使用
window.NiiVueViewer = NiiVueViewer;
