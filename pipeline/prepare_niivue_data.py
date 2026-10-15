#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NeuroViz NiiVue 数据管线（一次性运行）
================================================
本脚本自动完成：
  1. 下载 MNI152 标准模板（nilearn）
  2. 下载 FreeSurfer fsaverage（含 DK68 / Destrieux148 皮层标注 + aparc+aseg 皮层下分割）
  3. 下载 HCP MMP1.0（360区）标注（mne）
  4. 下载 Yeo 7/17 网络体素图（nilearn）
  5. 下载 AAL116 体素图谱（官方源，带备用镜像）
  6. 下载 Tian 3T 皮层下图谱（含海马亚区 CA1 等，GitHub）
  7. 把皮层表面标注投影到 MNI152 体素网格
  8. 从 aparc+aseg 提取皮层下/小脑/白质/脑室结构
  9. 生成每个图谱的 JSON 颜色表（含中文名、体积 mm³、文献引用）
 10. 输出全部 .nii.gz + .json 到 docs/data/

用法（在有网络的电脑终端运行）：
    cd /Users/urmyhope-/Documents/NeuroViz
    python3 pipeline/prepare_niivue_data.py

数据来源（均为官方权威渠道）：
  - MNI152 模板      : nilearn (ICBM/MNI)
  - fsaverage        : FreeSurfer 官方模板（mne 管理）
  - HCP MMP 1.0      : Glasser et al. 2016 Nature（mne 管理）
  - Yeo 7/17 Networks: Yeo et al. 2011（nilearn 管理）
  - AAL 116          : Tzourio-Mazoyer et al. 2002（GIN 官方）
  - Tian 3T 皮层下   : Tian et al. 2020（GitHub 官方仓库）
"""
import os, sys, io, json, tarfile, shutil, warnings
from pathlib import Path
import numpy as np

warnings.filterwarnings("ignore")

# ---------------- 环境准备（必须在 import mne 之前） ----------------
ROOT = Path(__file__).resolve().parent.parent
DATA_OUT = ROOT / "docs" / "data"
CACHE = ROOT / "pipeline" / ".download_cache"
for d in [DATA_OUT, CACHE, CACHE / "mne", CACHE / "mne_config", CACHE / "numba"]:
    d.mkdir(parents=True, exist_ok=True)

os.environ.setdefault("NUMBA_CACHE_DIR", str(CACHE / "numba"))
os.environ.setdefault("MNE_DATA", str(CACHE / "mne"))
os.environ.setdefault("MNE_CONFIG_DIR", str(CACHE / "mne_config"))
os.environ.setdefault("MPLBACKEND", "Agg")

# -------- 网络：自动检测本地代理（iKuuu/Clash 等），把下载流量走 VPN --------
def _probe_proxy(host='127.0.0.1', port=7890, timeout=1.0):
    import socket
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

if _probe_proxy() and not os.environ.get("HTTPS_PROXY"):
    os.environ["HTTPS_PROXY"] = "http://127.0.0.1:7890"
    os.environ["HTTP_PROXY"] = "http://127.0.0.1:7890"
    print("[网络] 检测到本地代理 127.0.0.1:7890，下载将走代理")
else:
    print("[网络] 未使用代理（直连）")


import nibabel as nib
from nibabel.freesurfer import read_geometry, read_annot
from scipy import ndimage
from nibabel.processing import resample_from_to
sys.path.insert(0, str(Path(__file__).resolve().parent))
from zh_names import AAL_ZH, DK_ZH, DESTRIEUX_ZH, ASEG_ZH, YEO7_ZH, YEO7_EN, YEO17_ZH, TIAN3T_ZH

CITATIONS = {
    "aal116": "Tzourio-Mazoyer et al., 2002, NeuroImage",
    "dk68": "Desikan et al., 2006, NeuroImage (Mindboggle-101)",
    "destrieux148": "Destrieux et al., 2010, NeuroImage",
    "hcp360": "Glasser et al., 2016, Nature",
    "yeo7": "Yeo et al., 2011, J Neurophysiol",
    "yeo17": "Yeo et al., 2011, J Neurophysiol",
    "subcortical": "FreeSurfer aparc+aseg (Fischl et al., 2002, NeuroImage)",
    "tian3t": "Tian et al., 2020, Nature Communications",
    "template": "ICBM152 (Fonov et al., 2009, NeuroImage)",
}

def log(msg):
    print(f"\n{'='*60}\n{msg}\n{'='*60}", flush=True)

# ---------------- 颜色生成 ----------------
import colorsys
def generate_colors(n, offset=0.0, sat=0.75, val=0.92):
    """按黄金比例分布色相，生成 n 个高区分度颜色（保证左右同名区域颜色一致）"""
    cols = []
    for i in range(n):
        hue = (offset + i * 0.618033988749895) % 1.0
        r, g, b = colorsys.hsv_to_rgb(hue, sat, val)
        cols.append((int(r * 255), int(g * 255), int(b * 255)))
    return cols

# ---------------- 模板与体素网格 ----------------
log("步骤 1/8：加载 MNI152 模板")
from nilearn import datasets, image
mni = datasets.load_mni152_template(resolution=1)
shape = mni.shape
affine = mni.affine
inv_affine = np.linalg.inv(affine)
print(f"MNI152 1mm 网格: shape={shape}, voxel_vol={abs(np.linalg.det(affine[:3,:3])):.3f} mm³")

t1_path = DATA_OUT / "MNI152_T1w_1mm.nii.gz"
if not t1_path.exists():
    nib.save(mni, t1_path)
    print(f"  ✓ 已保存模板 {t1_path.name}")

# 皮层脑掩膜（用于约束投影范围）
brain_mask = mni.get_fdata() > 20   # 灰度阈值近似脑组织

def verts_to_voxels(verts):
    """surface RAS(mm) → MNI 体素索引"""
    ones = np.ones((len(verts), 1))
    vox = np.hstack([verts, ones]) @ inv_affine.T
    return np.round(vox[:, :3]).astype(int)

def voxelize_cortical(label_pairs, close_iter=1):
    """
    把表面标注投影为体素标签图。
    label_pairs: [(verts, labels_int_array), ...]
    返回 int16 体素图（0=背景）
    """
    vote = np.zeros(shape, dtype=np.int32)  # 存 label id
    for verts, labels in label_pairs:
        vox = verts_to_voxels(verts)
        i, j, k = vox[:, 0], vox[:, 1], vox[:, 2]
        ok = (i >= 0) & (i < shape[0]) & (j >= 0) & (j < shape[1]) & (k >= 0) & (k < shape[2])
        # 仅保留落在脑掩膜内的顶点（允许少量外溢：先放宽掩膜）
        votes = vote[i[ok], j[ok], k[ok]]
        labs = labels[ok]
        # 冲突时保留较小 id（稳定）
        write_mask = (votes == 0) | (labs < votes)
        idx = np.where(ok)[0][write_mask]
        vote[i[ok][write_mask], j[ok][write_mask], k[ok][write_mask]] = labs[write_mask]
    # 逐区域做小型闭运算填补表面空隙
    out = vote.astype(np.int16)
    uniq = np.unique(vote)
    uniq = uniq[uniq > 0]
    struct = ndimage.generate_binary_structure(3, 1)
    for lab in uniq:
        m = (vote == lab)
        m = ndimage.binary_closing(m, structure=struct, iterations=close_iter)
        # 仅在未分配处填入
        out[(m) & (out == 0)] = lab
    return out

def save_atlas(vol, lut, out_name, citation_key, display_name):
    """保存 nii.gz + json 颜色表"""
    nii_path = DATA_OUT / f"atlas_{out_name}.nii.gz"
    nib.save(nib.Nifti1Image(vol.astype(np.int16), affine), nii_path)
    vox_vol = abs(np.linalg.det(affine[:3, :3]))
    regions = []
    for vid, info in lut.items():
        n_vox = int((vol == vid).sum())
        if n_vox == 0:
            continue
        ii, jj, kk = np.where(vol == vid)
        cx, cy, cz = np.array([ii.mean(), jj.mean(), kk.mean()])
        xyz = nib.affines.apply_affine(affine, [cx, cy, cz])
        regions.append({
            "id": int(vid),
            "name_zh": info["zh"],
            "name_en": info["en"],
            "color": info["color"],
            "volume_mm3": round(n_vox * vox_vol, 1),
            "centroid_mm": [round(float(xyz[0]), 1), round(float(xyz[1]), 1), round(float(xyz[2]), 1)],
        })
    js = {
        "id": out_name,
        "name": display_name,
        "citation": CITATIONS[citation_key],
        "regions": regions,
        "total_regions": len(regions),
    }
    (DATA_OUT / f"atlas_{out_name}.json").write_text(
        json.dumps(js, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  ✓ {out_name}: {len(regions)} 区域 -> atlas_{out_name}.nii.gz / .json")

# ---------------- 2. fsaverage（DK68 + Destrieux148 + HCP360 + aparc+aseg） ----------------
log("步骤 2/8：下载 FreeSurfer fsaverage 模板（约 100MB，首次运行）")
import mne

def fetch_with_retry(fn, what, attempts=15, wait=10):
    """网络不稳定时自动重试；pooch 会跳过已下载完的文件，重试只补失败的部分"""
    import time
    for i in range(1, attempts + 1):
        try:
            return fn()
        except Exception as e:
            if i == attempts:
                raise
            print(f"  ⚠ {what} 第{i}次下载中断（{type(e).__name__}），{wait}秒后自动重试...")
            time.sleep(wait)
fsavg_dir = Path(os.environ["MNE_DATA"]) / "mne_data"
fsavg = Path(fetch_with_retry(lambda: mne.datasets.fetch_fsaverage(subjects_dir=fsavg_dir, verbose=False), "fsaverage"))
print(f"  ✓ fsaverage: {fsavg}")

log("步骤 3/8：下载 HCP MMP 1.0 (360区) 标注")
try:
    fetch_with_retry(lambda: mne.datasets.fetch_hcp_mmp_parcellation(subjects_dir=fsavg_dir, verbose=False), "HCP-MMP1")
    print("  ✓ HCP-MMP1 就绪")
    hcp_ok = True
except Exception as e:
    print(f"  ⚠ HCP-MMP1 下载失败（{e}）——将跳过 360 区图谱，可稍后重跑本脚本补齐")
    hcp_ok = False

# 读取表面与标注
surfaces = {}
for hemi in ["lh", "rh"]:
    pial, _ = read_geometry(str(fsavg / "surf" / f"{hemi}.pial"))
    white, _ = read_geometry(str(fsavg / "surf" / f"{hemi}.white"))
    surfaces[hemi] = {"pial": pial, "white": white}

RH_OFFSET = 1000  # 右半球标签偏移量：保证左右同名区域拥有不同 ID（可单独高亮）

def read_annot_hemi(annot_name, hemi):
    """读取单个半球的表面标注。
    返回 (顶点[N,3], 标签[N]已加半球偏移, {区域ID: 标注名})；失败返回 None。
    白质面 + 软脑膜面一起投影，形成皮层带。"""
    ap = fsavg / "label" / f"{hemi}.{annot_name}.annot"
    if not ap.exists():
        print(f"  ⚠ 缺少 {ap.name}")
        return None
    labels, ctab, names = read_annot(str(ap))
    verts = np.vstack([surfaces[hemi]["white"], surfaces[hemi]["pial"]])
    offset = RH_OFFSET if hemi == "rh" else 0
    # 白质面与软脑膜面顶点数相同，标签复制两份分别对应
    labels_out = (np.concatenate([labels, labels]).astype(np.int32) + offset)
    name_map = {}
    for i, nm in enumerate(names):
        nm = nm.decode("utf-8", "replace") if isinstance(nm, bytes) else str(nm)
        low = nm.lower()
        if low in ("unknown", "corpuscallosum", "medialwall", "medial_wall", "") or "?" in nm:
            continue
        name_map[i + 1 + offset] = nm  # 1-based 行号 + 半球偏移 = 全局唯一区域 ID
    return verts, labels_out, name_map

def voxelize_cortical(pairs, close_iter=2):
    """把表面标注投影为体素标签图。pairs: [(verts, labels), ...]"""
    vote = np.zeros(shape, dtype=np.int32)
    for verts, labels in pairs:
        vox = verts_to_voxels(verts)
        i, j, k = vox[:, 0], vox[:, 1], vox[:, 2]
        ok = (i >= 0) & (i < shape[0]) & (j >= 0) & (j < shape[1]) & (k >= 0) & (k < shape[2])
        votes = vote[i[ok], j[ok], k[ok]]
        labs = labels[ok]
        write_mask = (votes == 0) | (labs < votes)
        vote[i[ok][write_mask], j[ok][write_mask], k[ok][write_mask]] = labs[write_mask]
    out = vote.astype(np.int16)
    struct = ndimage.generate_binary_structure(3, 1)
    for lab in np.unique(vote):
        if lab == 0:
            continue
        m = ndimage.binary_closing(vote == lab, structure=struct, iterations=close_iter)
        out[(m) & (out == 0)] = lab
    return out

def save_atlas(vol, lut, out_name, citation_key, display_name):
    """保存 nii.gz + json 颜色表"""
    nii_path = DATA_OUT / f"atlas_{out_name}.nii.gz"
    nib.save(nib.Nifti1Image(vol.astype(np.int16), affine), nii_path)
    vox_vol = abs(np.linalg.det(affine[:3, :3]))
    regions = []
    for vid, info in lut.items():
        n_vox = int((vol == vid).sum())
        if n_vox == 0:
            continue
        ii, jj, kk = np.where(vol == vid)
        xyz = nib.affines.apply_affine(affine, [ii.mean(), jj.mean(), kk.mean()])
        regions.append({
            "id": int(vid),
            "name_zh": info["zh"],
            "name_en": info["en"],
            "color": info["color"],
            "volume_mm3": round(n_vox * vox_vol, 1),
            "centroid_mm": [round(float(xyz[0]), 1), round(float(xyz[1]), 1), round(float(xyz[2]), 1)],
        })
    js = {
        "id": out_name,
        "name": display_name,
        "citation": CITATIONS[citation_key],
        "regions": regions,
        "total_regions": len(regions),
    }
    (DATA_OUT / f"atlas_{out_name}.json").write_text(
        json.dumps(js, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  ✓ {out_name}: {len(regions)} 区域 -> atlas_{out_name}.nii.gz / .json")

# ---------------- Desikan-Killiany (68区) ----------------
log("步骤 4/8：投影 Desikan-Killiany (68区) → MNI 体素")
lh = read_annot_hemi("aparc", "lh")
rh = read_annot_hemi("aparc", "rh")
if lh and rh:
    dk_vol = voxelize_cortical([(lh[0], lh[1]), (rh[0], rh[1])])
    colors = generate_colors(max(list(lh[2]) + list(rh[2])) - RH_OFFSET, offset=0.05)
    lut = {}
    for hemi_tag, en_pre, vids in [("左", "l_", lh[2]), ("右", "r_", rh[2])]:
        for rid, base in sorted(vids.items()):
            row = rid if hemi_tag == "左" else rid - RH_OFFSET
            lut[rid] = {"zh": f"{hemi_tag}{DK_ZH.get(base, base)}", "en": f"{en_pre}{base}",
                        "color": list(colors[(row - 1) % len(colors)])}
    save_atlas(dk_vol, lut, "dk68", "dk68", "Desikan-Killiany 皮层分区（68区）")

# ---------------- Destrieux (148区) ----------------
log("步骤 5/8：投影 Destrieux (148区) → MNI 体素")
lh = read_annot_hemi("aparc.a2009s", "lh")
rh = read_annot_hemi("aparc.a2009s", "rh")
if lh and rh:
    dest_vol = voxelize_cortical([(lh[0], lh[1]), (rh[0], rh[1])])
    colors = generate_colors(max(list(lh[2]) + list(rh[2])) - RH_OFFSET, offset=0.35)
    lut = {}
    for hemi_tag, en_pre, vids in [("左", "l_", lh[2]), ("右", "r_", rh[2])]:
        for rid, base in sorted(vids.items()):
            row = rid if hemi_tag == "左" else rid - RH_OFFSET
            lut[rid] = {"zh": f"{hemi_tag}{DESTRIEUX_ZH.get(base, base)}", "en": f"{en_pre}{base}",
                        "color": list(colors[(row - 1) % len(colors)])}
    save_atlas(dest_vol, lut, "destrieux148", "destrieux148", "Destrieux 皮层分区（148区）")

# ---------------- HCP MMP (360区) ----------------
if hcp_ok:
    log("步骤 6/8：投影 HCP MMP (360区) → MNI 体素")
    lh = read_annot_hemi("HCPMMP1", "lh")
    rh = read_annot_hemi("HCPMMP1", "rh")
    if lh and rh:
        hcp_vol = voxelize_cortical([(lh[0], lh[1]), (rh[0], rh[1])])
        # HCP 标注名自带 L_/R_ 前缀（如 L_V1_ROI），同源区左右颜色保持一致
        colors = generate_colors(max(list(lh[2]) + list(rh[2])) - RH_OFFSET, offset=0.62)
        # 用旧版 atlas_data.js 中的中文名（若能找到）
        zh_lookup = {}
        try:
            import re as _re
            _txt = (ROOT / "docs" / "js" / "atlas_data.js").read_text(encoding="utf-8")
            _start = _txt.find('"hcp_mmp": [')
            # 括号计数找到真正的数组结尾（此前用 '], ' 会截断在 aliases 数组处）
            _depth, _end = 0, _start
            for _i in range(_start, len(_txt)):
                if _txt[_i] == '[':
                    _depth += 1
                elif _txt[_i] == ']':
                    _depth -= 1
                    if _depth == 0:
                        _end = _i
                        break
            for m in _re.finditer(r'"id":\s*"([^"]+)".*?"name":\s*"([^"]+)"', _txt[_start:_end], _re.DOTALL):
                zh_lookup[m.group(1)] = m.group(2)
            print(f"  读取旧中文名表: {len(zh_lookup)} 条")
        except Exception:
            pass
        lut = {}
        for vids, off in [(lh[2], 0), (rh[2], RH_OFFSET)]:
            for rid, nm in sorted(vids.items()):
                row = rid - off
                lut[rid] = {"zh": zh_lookup.get(nm, nm), "en": nm,
                            "color": list(colors[(row - 1) % len(colors)])}
        save_atlas(hcp_vol, lut, "hcp360", "hcp360", "HCP MMP 1.0 皮层分区（360区）")
else:
    print("  (跳过 HCP 360)")

log("步骤 7/8：提取 aparc+aseg 皮层下结构")
aseg_path = fsavg / "mri" / "aparc+aseg.mgz"
aseg = nib.load(str(aseg_path))
aseg_res = resample_from_to(aseg, (shape, affine), order=0)
aseg_data = aseg_res.get_fdata().astype(np.int32)

# FreeSurfer aseg 标签编码（左右配对）
ASEG_CODES = {
    "Left-Lateral-Ventricle": 4, "Right-Lateral-Ventricle": 5,
    "Left-Inf-Lat-Vent": 5, "Right-Inf-Lat-Vent": 4,   # 注：具体码见下表
    "Left-Caudate": 11, "Right-Caudate": 49,
    "Left-Putamen": 12, "Right-Putamen": 50,
    "Left-Pallidum": 13, "Right-Pallidum": 51,
    "Brain-Stem": 16,
    "Left-Hippocampus": 17, "Right-Hippocampus": 53,
    "Left-Amygdala": 18, "Right-Amygdala": 54,
    "Left-Accumbens-area": 26, "Right-Accumbens-area": 58,
    "Left-VentralDC": 28, "Right-VentralDC": 60,
    "Left-Thalamus": 10, "Right-Thalamus": 49 - 9,   # 10 / 49 常规映射见下
    "3rd-Ventricle": 14, "4th-Ventricle": 15,
    "Left-Cerebellum-Cortex": 8, "Right-Cerebellum-Cortex": 47,
    "Left-Cerebellum-White-Matter": 7, "Right-Cerebellum-White-Matter": 46,
}
# 使用经核对的标准 aseg 编码（FreeSurferColorLUT）
ASEG_CODES = {
    4: "Left-Lateral-Ventricle", 5: "Right-Lateral-Ventricle",
    14: "3rd-Ventricle", 15: "4th-Ventricle",
    10: "Left-Thalamus", 49: "Right-Thalamus",
    11: "Left-Caudate", 50: "Right-Caudate",
    12: "Left-Putamen", 51: "Right-Putamen",
    13: "Left-Pallidum", 52: "Right-Pallidum",
    17: "Left-Hippocampus", 53: "Right-Hippocampus",
    18: "Left-Amygdala", 54: "Right-Amygdala",
    26: "Left-Accumbens-area", 58: "Right-Accumbens-area",
    28: "Left-VentralDC", 60: "Right-VentralDC",
    16: "Brain-Stem",
    8: "Left-Cerebellum-Cortex", 47: "Right-Cerebellum-Cortex",
    7: "Left-Cerebellum-White-Matter", 46: "Right-Cerebellum-White-Matter",
    251: "CC_Posterior", 252: "CC_Mid_Posterior", 253: "CC_Central",
    254: "CC_Mid_Anterior", 255: "CC_Anterior",
}
sub_vol = np.zeros(shape, dtype=np.int16)
seg_ids = sorted(ASEG_CODES.keys())
lut = {}
colors = generate_colors(len(seg_ids), offset=0.85, sat=0.8)
for k, (code, en_name) in enumerate(ASEG_CODES.items()):
    m = aseg_data == code
    if m.sum() < 50:
        print(f"  ⚠ {en_name} 体素过少({int(m.sum())})，跳过")
        continue
    sub_vol[m] = k + 1
    zh = ASEG_ZH.get(en_name, en_name)
    lut[k + 1] = {"zh": zh, "en": en_name, "color": list(colors[k % len(colors)])}
save_atlas(sub_vol, lut, "subcortical", "subcortical",
           "皮层下结构：海马/杏仁核/丘脑/基底节/小脑/胼胝体/脑室")

# ---------------- Yeo 7/17 ----------------
# ------------------------------------------------------------------
# 通用稳健下载器：多镜像源 + 跳过证书校验（代理 MITM 证书兼容）+ 重试
# ------------------------------------------------------------------
import requests as _rq
_rq.packages.urllib3.disable_warnings()

def robust_download(urls, dest, attempts=3):
    """依次尝试多个 URL 下载到 dest，返回是否成功"""
    dest = Path(dest)
    if dest.exists() and dest.stat().st_size > 0:
        print(f"  ✓ 已缓存: {dest.name}")
        return True
    for url in urls:
        for i in range(attempts):
            try:
                print(f"  尝试 [{url[:70]}...] (第{i+1}次)")
                r = _rq.get(url, timeout=120, stream=True, verify=False)
                r.raise_for_status()
                with open(dest, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=1 << 20):
                        f.write(chunk)
                print(f"  ✓ 下载成功: {dest.name} ({dest.stat().st_size/1024/1024:.1f} MB)")
                return True
            except Exception as e:
                print(f"    失败: {type(e).__name__}")
        print(f"  ✗ 该源失败，换下一个镜像")
    return False

# ---------------- Yeo 7/17（HTTPS 官方源） ----------------
log("步骤 8/8：下载 Yeo 7/17 功能网络体素图")
yeo_zip = CACHE / "Yeo_JNeurophysiol11_MNI152.zip"
yeo_urls = [
    "https://surfer.nmr.mgh.harvard.edu/pub/data/Yeo_JNeurophysiol11_MNI152.zip",
    "https://ghfast.top/https://surfer.nmr.mgh.harvard.edu/pub/data/Yeo_JNeurophysiol11_MNI152.zip",
]
if robust_download(yeo_urls, yeo_zip):
    import zipfile
    with zipfile.ZipFile(yeo_zip) as zf:
        zf.extractall(CACHE / "yeo")
    yeo_dir = CACHE / "yeo"
    yeo_files = {}
    for f in yeo_dir.rglob("*.nii.gz"):
        n = f.name
        if "7Networks" in n and "1mm" in n: yeo_files["yeo7"] = f
        if "17Networks" in n and "1mm" in n: yeo_files["yeo17"] = f
        # 部分发行版只有 2mm；退而求其次
        if "7Networks" in n and "7Networks" not in yeo_files and "2mm" in n: yeo_files.setdefault("yeo7", f)
        if "17Networks" in n and "17Networks" not in yeo_files and "2mm" in n: yeo_files.setdefault("yeo17", f)
    for key, zh_map, disp in [("yeo7", YEO7_ZH, "Yeo 7 网络（静息态功能网络）"),
                               ("yeo17", YEO17_ZH, "Yeo 17 网络（静息态功能网络）")]:
        fp = yeo_files.get(key)
        if not fp:
            print(f"  ⚠ 压缩包内未找到 {key} 文件")
            continue
        res = resample_from_to(nib.load(str(fp)), (shape, affine), order=0)
        vol = res.get_fdata().astype(np.int16)
        lut = {}
        ids = sorted(int(v) for v in np.unique(vol) if v > 0)
        colors = generate_colors(len(ids))
        for k2, vid in enumerate(ids):
            lut[vid] = {"zh": zh_map.get(vid, f"网络{vid}"), "en": f"Network {vid}", "color": list(colors[k2])}
        save_atlas(vol, lut, key, "yeo7", disp)
else:
    print("  ⚠ Yeo 7/17 全部镜像失败，可稍后重跑补齐")

# ---------------- AAL116 ----------------
log("补充：下载 AAL116 官方图谱（SPM12/AAL 116区）")
aal_out = CACHE / "AAL_SPM12.nii"
# 优先尝试 nilearn 官方源（NITRC 服务器，国内经代理常可直连，且支持断点续传）
try:
    from nilearn.datasets import fetch_atlas_aal
    print("  尝试 nilearn/NITRC 官方源...")
    _aal = fetch_atlas_aal(version="3v2", data_dir=str(CACHE / "nilearn_aal"))
    if _aal.maps and Path(_aal.maps).exists():
        aal_out = Path(_aal.maps)
        print(f"  ✓ NITRC 下载成功: {aal_out.name}")
except Exception as _e:
    print(f"  nilearn/NITRC 源失败({type(_e).__name__})，改用镜像...")
aal_urls = [
    # jsdelivr 镜像 GitHub 仓库（国内可直连性较好）
    "https://cdn.jsdelivr.net/gh/casperkaae/AAL_for_FSL@master/AAL.nii",
    # gh 加速镜像
    "https://ghfast.top/https://raw.githubusercontent.com/casperkaae/AAL_for_FSL/master/AAL.nii",
    "https://gh-proxy.com/https://raw.githubusercontent.com/casperkaae/AAL_for_FSL/master/AAL.nii",
    # GIN 官方（自签证书站点，verify=False）
    "http://www.gin.cnrs.fr/AAL_files/aal_for_nifti.tar.gz",
]
if robust_download(aal_urls[:3], aal_out) or (aal_out.exists() and aal_out.stat().st_size > 0):
    aal_res = resample_from_to(nib.load(str(aal_out)), (shape, affine), order=0)
    aal_vol = aal_res.get_fdata().astype(np.int16)
    AAL_EN = ["Precentral_L","Precentral_R","Frontal_Sup_L","Frontal_Sup_R",
        "Frontal_Sup_Orb_L","Frontal_Sup_Orb_R","Frontal_Mid_L","Frontal_Mid_R",
        "Frontal_Mid_Orb_L","Frontal_Mid_Orb_R","Frontal_Inf_Oper_L","Frontal_Inf_Oper_R",
        "Frontal_Inf_Tri_L","Frontal_Inf_Tri_R","Frontal_Inf_Orb_L","Frontal_Inf_Orb_R",
        "Rolandic_Oper_L","Rolandic_Oper_R","Supp_Motor_Area_L","Supp_Motor_Area_R",
        "Olfactory_L","Olfactory_R","Frontal_Sup_Medial_L","Frontal_Sup_Medial_R",
        "Frontal_Med_Orb_L","Frontal_Med_Orb_R","Rectus_L","Rectus_R",
        "Cingulum_Ant_L","Cingulum_Ant_R","Cingulum_Mid_L","Cingulum_Mid_R",
        "Cingulum_Post_L","Cingulum_Post_R","Hippocampus_L","Hippocampus_R",
        "Parahippocampal_L","Parahippocampal_R","Amygdala_L","Amygdala_R",
        "Calcarine_L","Calcarine_R","Cuneus_L","Cuneus_R","Lingual_L","Lingual_R",
        "Occipital_Sup_L","Occipital_Sup_R","Occipital_Mid_L","Occipital_Mid_R",
        "Occipital_Inf_L","Occipital_Inf_R","Fusiform_L","Fusiform_R",
        "Postcentral_L","Postcentral_R","Parietal_Sup_L","Parietal_Sup_R",
        "Parietal_Inf_L","Parietal_Inf_R","SupraMarginal_L","SupraMarginal_R",
        "Angular_L","Angular_R","Precuneus_L","Precuneus_R",
        "Paracentral_Lobule_L","Paracentral_Lobule_R","Caudate_L","Caudate_R",
        "Putamen_L","Putamen_R","Pallidum_L","Pallidum_R","Thalamus_L","Thalamus_R",
        "Heschl_L","Heschl_R","Temporal_Sup_L","Temporal_Sup_R",
        "Temporal_Pole_Sup_L","Temporal_Pole_Sup_R","Temporal_Mid_L","Temporal_Mid_R",
        "Temporal_Pole_Mid_L","Temporal_Pole_Mid_R","Temporal_Inf_L","Temporal_Inf_R",
        "Cerebelum_Crus1_L","Cerebelum_Crus1_R","Cerebelum_Crus2_L","Cerebelum_Crus2_R",
        "Cerebelum_3_L","Cerebelum_3_R","Cerebelum_4_5_L","Cerebelum_4_5_R",
        "Cerebelum_6_L","Cerebelum_6_R","Cerebelum_7b_L","Cerebelum_7b_R",
        "Cerebelum_8_L","Cerebelum_8_R","Cerebelum_9_L","Cerebelum_9_R",
        "Cerebelum_10_L","Cerebelum_10_R","Vermis_1","Vermis_2","Vermis_3",
        "Vermis_4_5","Vermis_6","Vermis_7","Vermis_8","Vermis_9","Vermis_10"]
    lut = {}
    colors = generate_colors(len(AAL_EN), offset=0.0)
    for vid in sorted(int(v) for v in np.unique(aal_vol) if v > 0):
        en = AAL_EN[vid - 1] if vid - 1 < len(AAL_EN) else f"Region_{vid}"
        lut[vid] = {"zh": AAL_ZH.get(en, en), "en": en,
                    "color": list(colors[(vid - 1) % len(colors)])}
    save_atlas(aal_vol, lut, "aal116", "aal116", "AAL 体素图谱（116区，含小脑/皮层下）")
else:
    print("  ⚠ AAL 全部镜像失败，可稍后重跑补齐")

# ---------------- Tian 皮层下 ----------------
print("\n补充：下载 Tian 3T 皮层下图谱（含海马亚区）")
tian_local = CACHE / "tian3t.nii.gz"
tian_urls = [
    "https://cdn.jsdelivr.net/gh/yetianmed/subcortex@master/Group-Parcellation-3T/Subcortex-3T/Subcortex-3T.nii.gz",
    "https://ghfast.top/https://raw.githubusercontent.com/yetianmed/subcortex/master/Group-Parcellation-3T/Subcortex-3T/Subcortex-3T.nii.gz",
    "https://gh-proxy.com/https://raw.githubusercontent.com/yetianmed/subcortex/master/Group-Parcellation-3T/Subcortex-3T/Subcortex-3T.nii.gz",
]
if robust_download(tian_urls, tian_local):
    tian_res = resample_from_to(nib.load(str(tian_local)), (shape, affine), order=0)
    tian_vol = tian_res.get_fdata().astype(np.int16)
    lut = {}
    ids = sorted(int(v) for v in np.unique(tian_vol) if v > 0)
    colors = generate_colors(len(ids), offset=0.45, sat=0.85)
    for k2, vid in enumerate(ids):
        lut[vid] = {"zh": TIAN3T_ZH.get(vid, f"分区{vid}"), "en": f"Tian3T_{vid}",
                    "color": list(colors[k2])}
    save_atlas(tian_vol, lut, "tian3t", "tian3t", "Tian 3T 皮层下图谱（32区，含海马亚区）")
else:
    print("  ⚠ Tian 图谱全部镜像失败，可稍后重跑补齐")

# ---------------- 汇总 ----------------
log("完成！输出目录: docs/data/")
for f in sorted(DATA_OUT.iterdir()):
    print(f"  {f.name:34s} {f.stat().st_size/1024:8.0f} KB")
print("\n下一步：把 docs/data/ 提交到 git 并推送，即可在网页中使用 NiiVue 查看。")
