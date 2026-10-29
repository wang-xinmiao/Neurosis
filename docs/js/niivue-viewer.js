/* =====================================================================
 * NeuroViz 查看器（双模式）
 *   renderMode='mesh'   每脑区独立 mz3 网格（结构分区模块，默认）
 *                       自维护 mesh 注册表 → 单独显隐/高亮；点击/图例/搜索均可选区
 *   renderMode='volume' NIfTI 体素 + LUT（交互分析模块四视图用）
 * ===================================================================== */
class NiiVueViewer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.onRegionPick = options.onRegionPick || null;
        this.dataBase = options.dataBase || './data/';
        this.meshBase = options.meshBase || './static/';
        this.viewMode = options.viewMode || 'render';      // render | multiplanar
        this.renderMode = options.renderMode || 'mesh';    // mesh | volume
        this.meshRegistry = [];   // ★ 自维护 Mesh 注册表（不依赖 NiiVue 内部状态）
        this.subMeshes = [];      // 皮层下网格（跨图谱复用）
        this.regionMeta = null;   // 当前图谱 meta 行数组
        this.subMeta = null;
        this.atlasMeta = null;    // 兼容体积模式
        this.highlight = null;
        this.hemiFilter = 'both';
        this._pickPending = false;
        this._pickPointerDown = null;
        this._destroyed = false;

        const container = document.getElementById(containerId);
        container.querySelectorAll('canvas').forEach(c => c.remove());
        this.canvas = document.createElement('canvas');
        this.canvas.id = containerId + '-glcanvas';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        container.appendChild(this.canvas);

        const isMP = this.viewMode === 'multiplanar';
        this.nv = new niivue.Niivue({
            sliceType: isMP ? 3 : 4,
            backColor: [0.02, 0.02, 0.06, 1.0],
            show3Dcrosshair: isMP,
            crosshairColor: [0, 188, 212, 255],
            isAxialCrosshairVisible: isMP,
            isCornerOrientationText: false,
            isOrientationTextVisible: false,
            multiplanarLayout: isMP ? 2 : 0,   // 2=GRID 2x2，四视口位置固定（枚举 AUTO0/COLUMN1/GRID2/ROW3）
            blendOpacity: 0.9,
            atlasOutline: this.renderMode === 'volume' ? 2 : 0,
            showLegend: false,
            forceDevicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.25),
        });
        // 强制开启 WebGL 多重采样，保证白色轮廓线平滑
        this.nv.attachToCanvas(this.canvas, true);

        // ===== 自定义"白色幽灵"网格着色器（用于非选中脑区）=====
        // 内部很透明，法线接近侧面（轮廓/边缘）处更不透明 -> 形成白色描边效果
        this.ghostShaderIndex = null;
        if (this.renderMode === 'mesh') {
            const ghostFrag = `#version 300 es
precision highp int; precision highp float;
uniform float opacity;
in vec4 vClr;
in vec3 vN;
out vec4 color;
void main() {
    vec3 n = normalize(vN);
    // 正交投影下视线近似 +Z；|n.z| 小 => 该处为轮廓/边缘
    float fres = 1.0 - abs(n.z);
    fres = pow(fres, 4.5);              // 指数越大，描边越细
    float a = mix(0.045, 0.42, fres);   // 内部 0.045（极透明）→ 边缘 0.42（较细白线）
    color = vec4(1.0, 1.0, 1.0, a * opacity);
}`;
            try { this.ghostShaderIndex = this.nv.setCustomMeshShader(ghostFrag, 'WhiteGhost'); }
            catch (e) { console.warn('[NiiVueViewer] 创建白色幽灵着色器失败:', e); }
        }

        if (isMP) {
            // GRID 2x2：左上轴位 / 右上矢状 / 左下冠状 / 右下3D
            // 每个标签居中于自己象限顶部，避开 NiiVue 内置的角标文字
            const badges = [
                ['轴位 Axial',    'top:6px;left:25%;transform:translateX(-50%);'],
                ['矢状位 Sagittal','top:6px;left:75%;transform:translateX(-50%);'],
                ['冠状位 Coronal', 'top:calc(50% + 6px);left:25%;transform:translateX(-50%);'],
                ['3D 渲染',        'top:calc(50% + 6px);left:75%;transform:translateX(-50%);'],
            ];
            for (const [text, pos] of badges) {
                const b = document.createElement('div');
                b.textContent = text;
                b.style.cssText = 'position:absolute;' + pos +
                    'z-index:4;pointer-events:none;font-size:11px;padding:2px 8px;' +
                    'border-radius:4px;background:rgba(10,10,24,0.7);color:#9be8ff;' +
                    'border:1px solid rgba(0,188,212,0.35);';
                container.appendChild(b);
            }
            container.style.position = 'relative';
        }

        this.nv.onLocationChange = (loc) => this._handleLocation(loc);
        // 单击选区；拖拽旋转不能被误判为点击
        this.canvas.addEventListener('pointerdown', (e) => {
            this._pickPointerDown = { x: e.clientX, y: e.clientY, button: e.button };
        });
        this.canvas.addEventListener('pointerup', (e) => {
            const down = this._pickPointerDown;
            this._pickPointerDown = null;
            if (!down || down.button !== 0 || e.button !== 0) return;
            if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
            if (this.functionalInteractionMode) return;
            requestAnimationFrame(() => this._requestDepthPick());
        });
        this.canvas.addEventListener('pointercancel', () => { this._pickPointerDown = null; });
    }

    /* ---------------- 统一入口 ---------------- */
    async loadAtlas(atlasId, withSub = true) {
        if (this._destroyed) return null;
        this.atlasId = atlasId;
        this.highlight = null;
        if (this.renderMode === 'mesh') return this._loadAtlasMesh(atlasId, withSub);
        return this._loadAtlasVolume(atlasId, withSub);
    }

    /* ================= 网格模式 ================= */
    async _loadAtlasMesh(atlasId, withSub) {
        if (this._destroyed) return null;
        // ★ 清空注册表：先移除全部 mesh，防止叠加
        for (const m of this.meshRegistry) { try { this.nv.removeMesh(m); } catch (e) { /* ignore */ } }
        this.meshRegistry = [];

        const csv = await (await fetch(`${this.meshBase}atlas_${atlasId}/meta.csv?v=77`)).text();
        if (this._destroyed) return null;
        // meta.csv 为 CRLF 行尾：必须去掉 \r，否则表头最后一列会带 \r 导致 volume_mm3 取到 undefined
        const lines = csv.replace(/\r/g, '').trim().split('\n');
        const header = lines[0].split(',');
        const parse = (l) => {
            const c = l.split(','); const o = {};
            header.forEach((h, i) => o[h] = c[i]);
            o.id = Number(o.id); o.r = +o.r; o.g = +o.g; o.b = +o.b;
            o.color = [o.r, o.g, o.b];   // 图例色块需要 RGB 数组格式
            o.centroid_mm = [Number(o.centroid_x), Number(o.centroid_y), Number(o.centroid_z)];
            o.volume_mm3 = Number(o.volume_mm3) || 0;
            return o;
        };
        this.regionMeta = lines.slice(1).filter(Boolean).map(parse);

        // 皮层下网格：首次加载，之后复用
        if (withSub && this.subMeshes.length === 0) {
            const subCsv = await (await fetch(`${this.meshBase}atlas_subcortical/meta.csv?v=77`)).text();
            const sl = subCsv.replace(/\r/g, '').trim().split('\n'); const sh = sl[0].split(',');
            this.subMeta = sl.slice(1).filter(Boolean).map(l => {
                const c = l.split(','); const o = {};
                sh.forEach((h, i) => o[h] = c[i]);
                o.id = Number(o.id); o.r = +o.r; o.g = +o.g; o.b = +o.b;
                o.color = [o.r, o.g, o.b];
                o.centroid_mm = [Number(o.centroid_x), Number(o.centroid_y), Number(o.centroid_z)];
                o.volume_mm3 = Number(o.volume_mm3) || 0;
                return o;
            });
            for (const reg of this.subMeta) {
                try {
                    const m = await this.nv.addMeshFromUrl({
                        url: `${this.meshBase}atlas_subcortical/${reg.filename}?v=77`,
                        name: reg.filename,
                    });
                    if (m && !this._destroyed) { m.regionId = reg.id; m.isSub = true; this.subMeshes.push(m); this.meshRegistry.push(m); }
                } catch (e) { console.warn('sub mesh 失败', reg.filename); }
            }
        } else if (withSub) {
            for (const m of this.subMeshes) this.meshRegistry.push(m);
        }

        // loading 遮罩 + 分批加载皮层网格
        const container = document.getElementById(this.containerId);
        const ov = document.createElement('div');
        ov.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
            'background:rgba(5,5,14,0.75);color:#9be8ff;font-size:13px;z-index:6;gap:8px;';
        ov.innerHTML = '<div>正在加载脑区模型，请稍候…</div><div id="nvLoadPct_' + this.containerId + '" style="font-size:12px;color:#7a8aa0;">0 / ' + this.regionMeta.length + '</div>';
        container.style.position = 'relative';
        this.loadingOverlay = ov;
        container.appendChild(ov);

        const BATCH = 12; let done = 0;
        for (let i = 0; i < this.regionMeta.length; i += BATCH) {
            if (this._destroyed) break;
            const batch = this.regionMeta.slice(i, i + BATCH);
            await Promise.all(batch.map(async (reg) => {
                try {
                    const mesh = await this.nv.addMeshFromUrl({
                        url: `${this.meshBase}atlas_${atlasId}/${reg.filename}?v=77`,
                        name: reg.filename,
                    });
                    if (mesh && !this._destroyed) { mesh.regionId = reg.id; this.meshRegistry.push(mesh); }
                } catch (e) { console.warn('[NiiVueViewer] 网格加载失败:', reg.filename, e); }
                done++;
            }));
            if (this._destroyed) break;
            const pct = document.getElementById('nvLoadPct_' + this.containerId);
            if (pct) pct.textContent = `${done} / ${this.regionMeta.length}`;
        }
        ov.remove();
        this.loadingOverlay = null;
        if (this._destroyed) return null;
        this._applyMeshHighlight();
        this.ready = true;
        return { name: atlasId, regions: this.regionMeta };
    }

    /**
     * 网格高亮：
     *  - 选中区域：原始彩色、完全不透明（默认 Phong 着色器 index 0）
     *  - 其余区域：切换到"白色幽灵"着色器——整体很透明，轮廓/边缘描出较亮白线
     */
    _applyMeshHighlight() {
        const sel = this.highlight;                    // {id, isSub}
        const selId = sel ? sel.id : null;
        const selSub = sel ? !!sel.isSub : false;
        const selectedIds = this.functionalHighlightIds && this.functionalHighlightIds.size
            ? this.functionalHighlightIds
            : new Set(selId === null ? [] : [selId]);
        const DEFAULT_SHADER = 0;                     // NiiVue 默认 Phong（用顶点原色）
        const ghost = (this.ghostShaderIndex != null) ? this.ghostShaderIndex : DEFAULT_SHADER;
        for (const m of this.meshRegistry) {
            if (selId === null) {
                // 无选中：全部原色显示
                m.meshShaderIndex = DEFAULT_SHADER;
                m.opacity = 1.0; m.visible = true;
            } else if (selectedIds.has(m.regionId) && (!sel || !!m.isSub === selSub)) {
                // 选中：原色 + 不透明（同时匹配 id 与是否皮层下，防止 ID 撞车）
                m.meshShaderIndex = DEFAULT_SHADER;
                m.opacity = 1.0; m.visible = true;
            } else {
                // 其余：白色幽灵 + 边缘描边。opacity<1 才会开启混合
                m.meshShaderIndex = ghost;
                m.opacity = 0.9; m.visible = true;
            }
        }
        try { this.nv.drawScene(); } catch (e) { /* ignore */ }
    }

    /** 让某个脑区旋转到朝向镜头（并把十字准星移到该质心） */
    focusRegion(region) {
        if (!region || !region.centroid_mm) return;
        const [x, y, z] = region.centroid_mm;
        // 质心相对脑中心的方向 -> 目标方位角/仰角，使该区域转向镜头
        const az = Math.atan2(x, z) * 180 / Math.PI;
        const el = Math.atan2(y, Math.sqrt(x * x + z * z)) * 180 / Math.PI;
        try { this.nv.setRenderAzimuthElevation(az, el); } catch (e) { /* ignore */ }
        try { this.nv.setCrosshairLocation(region.centroid_mm, null); } catch (e) { /* ignore */ }
    }

    /* ================= 体积模式（四视图） ================= */
    async _loadAtlasVolume(atlasId, withSub = true) {
        this.atlasMeta = await (await fetch(`${this.dataBase}atlas_${atlasId}.json?v=77`)).json();
        const maxId = (this.atlasMeta.regions || []).reduce((m, r) => Math.max(m, r.id), 0);
        const lutLen = maxId + 1;
        const cR = new Float32Array(lutLen), cG = new Float32Array(lutLen),
              cB = new Float32Array(lutLen), cA = new Float32Array(lutLen);
        for (const r of (this.atlasMeta.regions || [])) {
            cR[r.id] = r.color[0]; cG[r.id] = r.color[1];
            cB[r.id] = r.color[2]; cA[r.id] = 255;
        }
        const volumes = [
            { url: `${this.dataBase}MNI152_T1w_1mm.nii.gz?v=77`, name: 't1.nii.gz', colormap: 'gray', opacity: 1.0 },
            { url: `${this.dataBase}atlas_${atlasId}.nii.gz?v=77`, name: `atlas_${atlasId}.nii.gz`,
              colormap: 'gray', opacity: 0.85, colormapLabel: { R: cR, G: cG, B: cB, A: cA } },
        ];
        try {
            await this.nv.loadVolumes(volumes);
        } catch (err) {
            console.error('[NiiVueViewer] loadVolumes 失败:', err);
            throw err;
        }
        this.atlasIndex = 1;
        this._applyLUT();
        this.ready = true;
        return this.atlasMeta;
    }

    /* ---------------- LUT（体积模式高亮） ---------------- */
    _isLeft(zh, en) { return /^[左L]/.test(zh || '') || /^[lL]_/.test(en || ''); }
    _isRight(zh, en) { return /^[右R]/.test(zh || '') || /^[rR]_/.test(en || ''); }

    _applyLUT() {
        const vol = this.nv.volumes[this.atlasIndex];
        if (!vol || !this.atlasMeta) return;
        const regions = this.atlasMeta.regions || [];
        const maxId = regions.reduce((m, r) => Math.max(m, r.id), 0);
        const lut = new Uint8Array((maxId + 1) * 4);
        for (const r of regions) {
            let rr = r.color[0], gg = r.color[1], bb = r.color[2], alpha = 200;
            const left = this._isLeft(r.name_zh, r.name_en);
            const right = this._isRight(r.name_zh, r.name_en);
            if ((this.hemiFilter === 'left' && right) || (this.hemiFilter === 'right' && left)) alpha = 0;
            const selectedIds = this.functionalHighlightIds && this.functionalHighlightIds.size
                ? this.functionalHighlightIds
                : new Set(this.highlight ? [this.highlight.id] : []);
            if (selectedIds.size) {
                if (selectedIds.has(r.id)) { rr = r.color[0]; gg = r.color[1]; bb = r.color[2]; alpha = 255; }
                else { rr = 255; gg = 255; bb = 255; alpha = 45; }
            }
            const i4 = r.id * 4;
            lut[i4] = rr; lut[i4 + 1] = gg; lut[i4 + 2] = bb; lut[i4 + 3] = alpha;
        }
        vol.lut = lut;
        if ('lutSegments' in vol) vol.lutSegments = maxId + 1;
        try { vol.opacity = this.highlight ? 0.95 : 0.85; } catch (e) { }
        try { this.nv.updateGLVolume(); } catch (e) { }
    }

    /* ---------------- 统一交互接口 ---------------- */
    setHighlight(regionId, opts = {}) {
        const focus = opts.focus !== false;   // 默认旋转居中（图例/搜索场景）；3D点击可传 false
        const wantSub = (opts.isSub === true); // 调用方明确指定来源，避免皮层/皮层下 ID 撞车
        const meta = this.renderMode === 'mesh' ? this.regionMeta : (this.atlasMeta ? this.atlasMeta.regions : []);
        const subList = this.renderMode === 'mesh' ? (this.subMeta || []) : [];
        let found = null, foundIsSub = false;
        if (wantSub) {
            found = (subList || []).find(r => r.id === regionId); foundIsSub = true;
        } else if (opts.isSub === false) {
            found = (meta || []).find(r => r.id === regionId); foundIsSub = false;
        } else {
            // 未指定来源：皮层优先，其次皮层下
            found = (meta || []).find(r => r.id === regionId); foundIsSub = false;
            if (!found && subList.length) { found = subList.find(r => r.id === regionId); foundIsSub = true; }
        }
        if (!found) { this.clearHighlight(); return null; }
        this.highlight = { id: found.id, isSub: foundIsSub, volumeName: '', citation: '' };
        if (this.renderMode === 'mesh') { this._applyMeshHighlight(); if (focus) this.focusRegion(found); }
        else {
            this.highlight.volIndex = this.atlasIndex;
            this._applyLUT();
            try { if (found.centroid_mm) this.nv.setCrosshairLocation(found.centroid_mm, null); } catch (e) { }
        }
        return found;
    }

    clearHighlight() {
        this.highlight = null;
        if (this.renderMode === 'mesh') this._applyMeshHighlight();
        else this._applyLUT();
    }

    setHemiFilter(mode) {
        this.hemiFilter = mode;
        if (this.renderMode === 'mesh') {
            for (const m of this.meshRegistry) {
                const reg = this._findReg(m.regionId);
                if (!reg) continue;
                const isL = this._isLeft(reg.name_zh, reg.name_en);
                const isR = this._isRight(reg.name_zh, reg.name_en);
                m.visible = !((mode === 'left' && isR) || (mode === 'right' && isL));
            }
            try { this.nv.drawScene(); } catch (e) { }
        } else this._applyLUT();
    }

    _findReg(id) {
        return (this.regionMeta || []).find(r => r.id === id) || (this.subMeta || []).find(r => r.id === id) || null;
    }

    /* ---------------- 点击拾取 ---------------- */
    _handleLocation(loc) {
        if (!this._pickPending) return;
        this._pickPending = false;
        if (this.renderMode === 'mesh') {
            if (!loc || !loc.mm || !this.regionMeta) return;
            const bestMesh = this._findMeshAtPoint(loc.mm);
            if (!bestMesh) return;
            const best = bestMesh.isSub
                ? (this.subMeta || []).find(r => r.id === bestMesh.regionId)
                : (this.regionMeta || []).find(r => r.id === bestMesh.regionId);
            if (best) {
                // 3D 直接点击：仅隔离该区域（不旋转，因为用户已经在看这里）
                this.setHighlight(best.id, { focus: false, isSub: !!bestMesh.isSub });
                if (this.onRegionPick) this.onRegionPick({ ...best });
            }
        } else {
            // 体积模式：单击拾取体素值
            if (!loc || !loc.values || loc.values.length < 2) return;
            const vid = Math.round(loc.values[this.atlasIndex] ? loc.values[this.atlasIndex].value : 0);
            if (vid > 0 && this.atlasMeta) {
                const reg = this.atlasMeta.regions.find(r => r.id === vid);
                if (reg) {
                    this.highlight = { id: reg.id };
                    this._applyLUT();
                    if (this.onRegionPick) this.onRegionPick({ ...reg });
                }
            }
        }
    }

    /** 深度拾取得到表面坐标后，用最近顶点确定实际命中的网格 */
    _findMeshAtPoint(point) {
        let best = null, bestDistance = Infinity;
        for (const mesh of this.meshRegistry) {
            const pts = mesh && mesh.pts;
            if (!pts || pts.length < 3) continue;
            for (let i = 0; i < pts.length; i += 3) {
                const dx = pts[i] - point[0];
                const dy = pts[i + 1] - point[1];
                const dz = pts[i + 2] - point[2];
                const distance = dx * dx + dy * dy + dz * dz;
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = mesh;
                }
            }
        }
        return best;
    }

    /* ---------------- 单击深度拾取 ---------------- */
    _requestDepthPick() {
        const nv = this.nv;
        if (!nv || !this.ready || !nv.uiData) return;
        if (nv.uiData.mousedown || nv.uiData.isDragging) return;
        this._pickPending = true;
        try {
            nv.uiData.mouseDepthPicker = true;
            nv.drawScene();
        } catch (e) {
            this._pickPending = false;
        }
    }

    /* ---------------- 功能网络：三维脑模型叠加 ---------------- */
    setFunctionalHighlightIds(regionIds = []) {
        this.functionalHighlightIds = new Set((regionIds || []).map(Number));
        this.highlight = null;
        if (this.renderMode === 'mesh') this._applyMeshHighlight();
        else this._applyLUT();
    }

    setFunctionalInteractionMode(enabled) {
        this.functionalInteractionMode = !!enabled;
        if (this.functionalInteractionMode) this.setupFunctionalOrbitControls();
    }

    setupFunctionalOrbitControls() {
        if (this._orbitControlsReady || !this.canvas) return;
        this._orbitControlsReady = true;
        const canvas = this.canvas;
        const nv = this.nv;
        if (!Array.isArray(nv.position)) nv.position = [0, 0, 0];

        const state = this.functionalCamera = {
            currentAzimuth: nv.scene.renderAzimuth || -35,
            currentElevation: nv.scene.renderElevation || 12,
            currentPosition: [...nv.position],
            currentScale: nv.scene.volScaleMultiplier || 1,
            targetAzimuth: nv.scene.renderAzimuth || -35,
            targetElevation: nv.scene.renderElevation || 12,
            targetPosition: [...nv.position],
            targetScale: nv.scene.volScaleMultiplier || 1,
            dragging: null,
            moved: false,
            lastX: 0,
            lastY: 0,
            dirty: false,
            updateLoop: null,
        };

        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
        const controlsUpdate = () => {
            if (state.dirty) {
                // 较低阻尼惯性、较高逐帧跟随系数，减少旋转/缩放输入延迟。
                const follow = 0.34;
                state.currentAzimuth += (state.targetAzimuth - state.currentAzimuth) * follow;
                state.currentElevation += (state.targetElevation - state.currentElevation) * follow;
                state.currentScale += (state.targetScale - state.currentScale) * follow;
                for (let i = 0; i < 3; i++) {
                    state.currentPosition[i] += (state.targetPosition[i] - state.currentPosition[i]) * follow;
                }

                nv.scene.renderAzimuth = state.currentAzimuth;
                nv.scene.renderElevation = state.currentElevation;
                nv.scene.volScaleMultiplier = state.currentScale;
                nv.position = [...state.currentPosition];
                nv.drawScene();
                if (typeof nv.onAzimuthElevationChange === 'function') {
                    nv.onAzimuthElevationChange(state.currentAzimuth, state.currentElevation);
                }

                const remaining =
                    Math.abs(state.targetAzimuth - state.currentAzimuth) +
                    Math.abs(state.targetElevation - state.currentElevation) +
                    Math.abs(state.targetScale - state.currentScale) +
                    state.targetPosition.reduce((sum, value, index) => sum + Math.abs(value - state.currentPosition[index]), 0);
                if (remaining < 0.015) {
                    state.currentAzimuth = state.targetAzimuth;
                    state.currentElevation = state.targetElevation;
                    state.currentScale = state.targetScale;
                    state.currentPosition = [...state.targetPosition];
                    state.dirty = false;
                }
            }
            state.updateLoop = requestAnimationFrame(controlsUpdate);
        };
        controlsUpdate();

        const requestAnimation = () => {
            state.dirty = true;
        };

        canvas.addEventListener('contextmenu', (event) => event.preventDefault());

        canvas.addEventListener('pointerdown', (event) => {
            if (!this.functionalInteractionMode) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            state.dragging = event.button === 2 ? 'pan' : 'rotate';
            state.moved = false;
            state.lastX = event.clientX;
            state.lastY = event.clientY;
            try { canvas.setPointerCapture(event.pointerId); } catch (e) { /* ignore */ }
        }, true);

        canvas.addEventListener('pointermove', (event) => {
            if (!this.functionalInteractionMode || !state.dragging) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const dx = event.clientX - state.lastX;
            const dy = event.clientY - state.lastY;
            if (Math.abs(dx) + Math.abs(dy) > 1) state.moved = true;
            state.lastX = event.clientX;
            state.lastY = event.clientY;

            if (state.dragging === 'rotate') {
                state.targetAzimuth += dx * 0.42;
                state.targetElevation = clamp(state.targetElevation + dy * 0.42, -89, 89);
            } else {
                const unit = (nv.furthestFromPivot || 100) / 520;
                state.targetPosition[0] = clamp(state.targetPosition[0] - dx * unit, -260, 260);
                state.targetPosition[1] = clamp(state.targetPosition[1] + dy * unit, -260, 260);
            }
            requestAnimation();
        }, true);

        const endDrag = (event) => {
            if (!this.functionalInteractionMode) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            state.dragging = null;
            try { canvas.releasePointerCapture(event.pointerId); } catch (e) { /* ignore */ }
        };
        canvas.addEventListener('pointerup', endDrag, true);
        canvas.addEventListener('pointercancel', endDrag, true);

        canvas.addEventListener('wheel', (event) => {
            if (!this.functionalInteractionMode) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            state.targetScale = clamp(state.targetScale * Math.exp(-event.deltaY * 0.0012), 0.38, 4.2);
            requestAnimation();
        }, { capture: true, passive: false });
    }

    projectFunctionalPoints(points) {
        const canvas = this.canvas;
        const width = canvas.clientWidth || canvas.width;
        const height = canvas.clientHeight || canvas.height;
        const [mvp] = this.nv.calculateMvpMatrix(
            this.nv.volumeObject3D,
            [0, 0, width, height],
            this.nv.scene.renderAzimuth,
            this.nv.scene.renderElevation,
        );
        return points.map((point) => {
            const [x, y, z] = point;
            const cx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
            const cy = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
            const cz = mvp[2] * x + mvp[6] * y + mvp[10] * z + mvp[14];
            const cw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];
            const w = Math.abs(cw) < 1e-6 ? 1 : cw;
            return {
                x: (cx / w + 1) * 0.5 * width,
                y: (1 - cy / w) * 0.5 * height,
                z: cz / w,
            };
        });
    }


    clearFunctionalConnectome() {
        if (!this.functionalConnectomeMesh) return;
        try { this.nv.removeMesh(this.functionalConnectomeMesh); } catch (e) { /* ignore */ }
        this.functionalConnectomeMesh = null;
        try { this.nv.drawScene(); } catch (e) { /* ignore */ }
    }

    setFunctionalConnectome(connectomeJson) {
        this.clearFunctionalConnectome();
        const nodes = connectomeJson.nodes || {};
        const nodeCount = Array.isArray(nodes.names) ? nodes.names.length : 0;
        const nodePts = new Float32Array(nodeCount * 3);
        for (let i = 0; i < nodeCount; i++) {
            nodePts[i * 3] = Number(nodes.x?.[i] || 0);
            nodePts[i * 3 + 1] = Number(nodes.y?.[i] || 0);
            nodePts[i * 3 + 2] = Number(nodes.z?.[i] || 0);
        }
        const mesh = new niivue.NVMesh(
            nodePts,
            new Uint32Array([0, 0, 0]),
            connectomeJson.name || 'functional-connectome',
            new Uint8Array([255, 255, 255, 255]),
            1.0,
            true,
            this.nv.gl,
            connectomeJson,
        );
        if (!mesh) return null;
        mesh.opacity = 0.0;
        mesh.visible = false;
        mesh.showLegend = false;
        this.functionalConnectomeMesh = mesh;
        this.nv.addMesh(mesh);
        try { this.nv.drawScene(); } catch (e) { /* ignore */ }
        return mesh;
    }

    applyFunctionalHeatmap(regionColors, selectedRegionId = null) {
        for (const mesh of this.meshRegistry) {
            if (mesh.isSub || !mesh.pts || mesh.pts.length < 3 || !mesh.tris) continue;
            const vertexCount = mesh.pts.length / 3;
            const rgba = new Uint8Array(vertexCount * 4);
            const entry = regionColors.get(mesh.regionId) || { rgb: [120, 132, 148], alpha: 105 };
            const [r, g, b] = entry.rgb;
            const alpha = selectedRegionId === mesh.regionId ? 255 : (entry.alpha ?? 185);
            for (let i = 0; i < vertexCount; i++) {
                const offset = i * 4;
                rgba[offset] = r;
                rgba[offset + 1] = g;
                rgba[offset + 2] = b;
                rgba[offset + 3] = alpha;
            }
            mesh.rgba255 = rgba;
            mesh.meshShaderIndex = 0;
            mesh.opacity = 1.0;
            mesh.visible = true;
            try { mesh.updateMesh(this.nv.gl); } catch (e) { console.warn('[NiiVueViewer] 热力图网格更新失败:', e); }
        }
        try { this.nv.drawScene(); } catch (e) { /* ignore */ }
    }

    setFunctionalBaseOpacity(opacity = 0.16, rgb = [182, 193, 204]) {
        for (const mesh of this.meshRegistry) {
            if (!mesh.pts || mesh.pts.length < 3 || !mesh.tris) continue;
            const vertexCount = mesh.pts.length / 3;
            const rgba = new Uint8Array(vertexCount * 4);
            for (let i = 0; i < vertexCount; i++) {
                const offset = i * 4;
                rgba[offset] = rgb[0];
                rgba[offset + 1] = rgb[1];
                rgba[offset + 2] = rgb[2];
                rgba[offset + 3] = 255;
            }
            mesh.rgba255 = rgba;
            mesh.meshShaderIndex = 0;
            mesh.opacity = opacity;
            mesh.visible = true;
            try { mesh.updateMesh(this.nv.gl); } catch (e) { /* ignore */ }
        }
        try { this.nv.drawScene(); } catch (e) { /* ignore */ }
    }

    destroy() {
        this._destroyed = true;
        if (this.loadingOverlay) {
            this.loadingOverlay.remove();
            this.loadingOverlay = null;
        }
        if (this.functionalCamera?.updateLoop) {
            cancelAnimationFrame(this.functionalCamera.updateLoop);
            this.functionalCamera.updateLoop = null;
        }
        this.clearFunctionalConnectome();
        for (const mesh of [...this.meshRegistry]) {
            try { this.nv.removeMesh(mesh); } catch (e) { /* ignore */ }
        }
        this.meshRegistry = [];
        try {
            const loseContext = this.nv.gl && this.nv.gl.getExtension('WEBGL_lose_context');
            if (loseContext) loseContext.loseContext();
        } catch (e) { /* ignore */ }
        if (this.canvas) this.canvas.remove();
    }

    getAllLegendData() {
        if (this.renderMode === 'mesh') {
            return {
                cortical: { name: `图谱 ${this.atlasId}`, citation: '—', regions: this.regionMeta || [] },
                subcortical: { regions: this.subMeta || [] },
            };
        }
        return {
            cortical: { name: this.atlasMeta?.name || '', citation: this.atlasMeta?.citation || '', regions: this.atlasMeta?.regions || [] },
            subcortical: { regions: this.subIndex > 0 && this.subMeta ? this.subMeta.regions : [] },
        };
    }

    getRegionInfo(regionId) {
        return this._findReg(regionId)
            || (this.atlasMeta?.regions || []).find(r => r.id === regionId) || null;
    }

    resetView() {
        if (this.renderMode === 'mesh') { this.clearHighlight(); return; }
        try { this.nv.resetDisplayToBaseImage(); } catch (e) { try { this.nv.resetView(); } catch (e2) { } }
        this.clearHighlight();
    }

    screenshot() {
        try { this.nv.saveImage({ filename: 'NeuroViz_' + (this.atlasId || 'view') + '.png', crop: true }); }
        catch (e) {
            try { this.nv.saveImage('NeuroViz.png', true); } catch (e2) {
                const a = document.createElement('a');
                a.href = this.canvas.toDataURL('image/png'); a.download = 'NeuroViz.png'; a.click();
            }
        }
    }
}

window.NiiVueViewer = NiiVueViewer;
