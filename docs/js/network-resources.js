/* NeuroViz 资源下载/校验模块：下载锁、矩阵维度、label ID、affine 校验 */
class NetworkResourceManager {
    constructor(options = {}) {
        this.onProgress = options.onProgress || (() => {});
        this.cache = new Map();
        this.locks = new Map();
        this.manifests = {
            schaefer7: {
                name: 'Schaefer7（100区）',
                nifti: './data/schaefer7_100parcels_7networks.nii.gz',
                labels: './data/schaefer7_labels.csv',
                matrix: './data/connectivity_schaefer7.csv',
                remoteNifti: 'https://raw.githubusercontent.com/ThomasYeoLab/CBIG/master/stable_projects/brain_parcellation/Schaefer2018_LocalGlobal/Parcellations/MNI/Schaefer2018_100Parcels_7Networks_order_FSLMNI152_1mm.nii.gz',
                remoteLabels: 'https://raw.githubusercontent.com/ThomasYeoLab/CBIG/master/stable_projects/brain_parcellation/Schaefer2018_LocalGlobal/Parcellations/MNI/Schaefer2018_100Parcels_7Networks_order.txt',
            },
            schaefer17: {
                name: 'Schaefer17（200区）',
                nifti: './data/schaefer17_200parcels_17networks.nii.gz',
                labels: './data/schaefer17_labels.csv',
                matrix: './data/connectivity_schaefer17.csv',
                remoteNifti: 'https://raw.githubusercontent.com/ThomasYeoLab/CBIG/master/stable_projects/brain_parcellation/Schaefer2018_LocalGlobal/Parcellations/MNI/Schaefer2018_200Parcels_17Networks_order_FSLMNI152_1mm.nii.gz',
                remoteLabels: 'https://raw.githubusercontent.com/ThomasYeoLab/CBIG/master/stable_projects/brain_parcellation/Schaefer2018_LocalGlobal/Parcellations/MNI/Schaefer2018_200Parcels_17Networks_order.txt',
            },
        };
    }

    async ensure(id) {
        if (this.cache.has(id)) return this.cache.get(id);
        if (this.locks.has(id)) return this.locks.get(id);
        const task = this._download(id);
        this.locks.set(id, task);
        try {
            const result = await task;
            this.cache.set(id, result);
            return result;
        } finally {
            this.locks.delete(id);
        }
    }

    async _download(id) {
        const manifest = this.manifests[id];
        if (!manifest) throw new Error('未知图谱模板');
        const fetchFirst = async (localUrl, remoteUrl, label) => {
            this.onProgress(`正在检查 ${label}…`);
            try {
                const local = await this.fetchWithTimeout(localUrl, 2500);
                if (local.ok) return await local.arrayBuffer();
            } catch (e) { /* local missing */ }
            this.onProgress(`本地缺少 ${label}，正在后台下载…`);
            const response = await this.fetchWithTimeout(remoteUrl, 8000);
            if (!response.ok) throw new Error(`${label} 下载失败（HTTP ${response.status}）`);
            return await response.arrayBuffer();
        };
        try {
            const [niftiBuffer, labelsBuffer, matrixBuffer] = await Promise.all([
                fetchFirst(manifest.nifti, manifest.remoteNifti, 'NIfTI'),
                fetchFirst(manifest.labels, manifest.remoteLabels, '标签表'),
                this._optional(manifest.matrix),
            ]);
            const labels = this.parseLabels(labelsBuffer);
            this.validateLabels(labels);
            await this.validateAffine(niftiBuffer);
            const matrix = matrixBuffer ? this.parseMatrix(matrixBuffer) : null;
            if (matrix) this.validateMatrix(matrix, labels.length);
            return { id, niftiBuffer, labels, matrix };
        } catch (error) {
            throw new Error(`${manifest.name}：${error.message}`);
        }
    }

    async _optional(url) {
        try {
            const response = await this.fetchWithTimeout(url, 2500);
            return response.ok ? await response.arrayBuffer() : null;
        } catch (e) {
            return null;
        }
    }

    async fetchWithTimeout(url, timeoutMs) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try { return await fetch(url, { signal: controller.signal }); }
        finally { clearTimeout(timer); }
    }

    parseLabels(buffer) {
        return new TextDecoder().decode(buffer).replace(/\r/g, '').split('\n').map((line) => {
            const parts = line.trim().split(/[\t, ]+/);
            if (!parts[0] || !/^\d+$/.test(parts[0])) return null;
            const rgb = parts.length >= 6 && parts.slice(1, 5).every((v) => /^\d+$/.test(v));
            return { id: Number(parts[0]), name: rgb ? parts.slice(5).join(' ') : (parts.slice(1).join(' ') || `Region_${parts[0]}`) };
        }).filter(Boolean);
    }

    parseMatrix(buffer) {
        const rows = new TextDecoder().decode(buffer).replace(/\r/g, '').trim().split('\n').map((line) => line.trim().split(/[\t, ]+/));
        if (rows.length && rows[0].some((value) => Number.isNaN(Number(value)))) rows.shift();
        return rows.map((row) => (row.length > 1 && Number.isNaN(Number(row[0])) ? row.slice(1) : row).map(Number));
    }

    validateLabels(labels) {
        const ids = new Set();
        labels.forEach((label) => {
            if (ids.has(label.id)) throw new Error(`标签映射异常：ID ${label.id} 重复`);
            ids.add(label.id);
        });
        if (!labels.length) throw new Error('标签映射异常：没有有效标签');
    }

    validateMatrix(matrix, regionCount) {
        if (!Array.isArray(matrix) || matrix.length !== regionCount) throw new Error(`连接矩阵行数与 ROI 数 ${regionCount} 不匹配`);
        matrix.forEach((row) => {
            if (!Array.isArray(row) || row.length !== regionCount) throw new Error(`连接矩阵列数与 ROI 数 ${regionCount} 不匹配`);
            row.forEach((value) => { if (!Number.isFinite(Number(value))) throw new Error('连接矩阵包含非数值元素'); });
        });
    }

    async validateAffine(buffer) {
        if (!window.niivue?.NVImage) return true;
        const image = await niivue.NVImage.loadFromUrl({ url: 'array.nii.gz', buffer });
        const rows = [image.hdr?.srow_x, image.hdr?.srow_y, image.hdr?.srow_z].filter((row) => row && row.length >= 4);
        const expected = [[1, 0, 0, -98], [0, 1, 0, -134], [0, 0, 1, -72]];
        rows.forEach((row, i) => expected[i].forEach((value, j) => {
            if (Math.abs(Number(row[j]) - value) > 0.01) throw new Error('NIfTI affine 与 MNI152 不一致');
        }));
        return true;
    }

    validateMatrixDistribution(matrix) {
        const values = [];
        matrix.forEach((row, i) => row.forEach((value, j) => { if (i !== j) values.push(Math.abs(Number(value))); }));
        const high = values.filter((value) => value >= 0.95).length / Math.max(1, values.length);
        const low = values.filter((value) => value <= 0.02).length / Math.max(1, values.length);
        if (high > 0.85) return '矩阵相关性异常偏高，请检查时序与相关计算';
        if (low > 0.85) return '矩阵数值接近全0，请检查csv读取或者相关计算流程';
        return '';
    }
}
window.NetworkResourceManager = NetworkResourceManager;
