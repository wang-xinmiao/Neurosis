#!/usr/bin/env python3
"""
从 FreeSurfer fsaverage 高分辨率表面 + 多套权威分区标注生成顶点着色 OBJ。
图谱方案（使用 MNE 自带的 fsaverage 数据，无需额外下载）：
  1. Desikan-Killiany (aparc, 68区) —— 最经典的解剖分区
  2. Destrieux (aparc.a2009s, 148区) —— 更细的解剖分区
  3. HCP MMP 1.0 (360区) —— 多模态功能分区
  4. DKTatlas (aparc.DKTatlas, 62区) —— 改进版解剖分区

生成的 OBJ 放在 models/ 目录下，命名格式: brain_{hemi}_{atlas}.obj
颜色表导出到 models/atlas_colors.json
"""

import json
import os
import sys
from pathlib import Path

import nibabel as nib
import numpy as np

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------
WORKSPACE = Path(__file__).resolve().parent
MODELS_DIR = WORKSPACE / "models"
MODELS_DIR.mkdir(exist_ok=True)

TMP_DIR = WORKSPACE / ".atlas_cache"
TMP_DIR.mkdir(exist_ok=True)

# 每套图谱的输出标签
ATLASES = {
    "desikan": {"annot": "aparc", "hemi_labels": 34},
    "destrieux": {"annot": "aparc.a2009s", "hemi_labels": 74},
    "hcp_mmp": {"annot": "HCPMMP1", "hemi_labels": 180},
    "yeo7": {"annot": "Yeo2011_7Networks_N1000", "hemi_labels": 500},
}


def ensure_fsaverage(subjects_dir):
    """使用 MNE 下载 fsaverage 高分辨率表面。"""
    import mne

    fsaverage = subjects_dir / "fsaverage"
    pial_lh = fsaverage / "surf" / "lh.pial"
    if not pial_lh.exists():
        print("[1/3] 下载 fsaverage 高分辨率表面模板...")
        mne.datasets.fetch_fsaverage(subjects_dir=str(subjects_dir), verbose=True)
    else:
        print("[1/3] fsaverage 已存在，跳过")


def ensure_hcp_mmp(subjects_dir):
    """MNE 下载 HCP-MMP1.0 标注。"""
    import mne

    label_dir = subjects_dir / "fsaverage" / "label"
    label_dir.mkdir(parents=True, exist_ok=True)
    if not (label_dir / "lh.HCPMMP1.annot").exists():
        print("[2/3] 下载 HCP MMP 1.0 分区标注...")
        mne.datasets.fetch_hcp_mmp_parcellation(
            subjects_dir=str(subjects_dir), verbose=True
        )
    else:
        print("[2/3] HCP MMP 1.0 已存在，跳过")


def write_colored_obj(vertices, faces, colors, out_path):
    """
    将顶点列表 + 三角面 + 逐顶点颜色写入 Wavefront OBJ。
    vertices: (N, 3) float32
    faces:    (M, 3) int32 (0-based)
    colors:   (N, 3) float32 (0..1)
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for v, c in zip(vertices, colors):
            f.write(f"v {v[0]:.6f} {v[1]:.6f} {v[2]:.6f} "
                    f"{c[0]:.6f} {c[1]:.6f} {c[2]:.6f}\n")
        for tri in faces:
            f.write(f"f {tri[0]+1} {tri[1]+1} {tri[2]+1}\n")

    size_kb = out_path.stat().st_size / 1024
    print(f"    ✓ {out_path.name}  ({size_kb:.0f} KB)")


def generate_hemi_obj(hemi, surf_path, annot_path, atlas_id):
    """为单个半球生成顶点着色 OBJ，返回标签列表。

    nib.freesurfer.read_annot 返回的 label_ids 是 ctab/names 数组的**行索引**
    (0-based)，而不是 ctab[:,4] 里存储的 FreeSurfer 标签编码值。因此颜色与名称
    必须按行索引 lookup。
    """
    verts, faces = nib.freesurfer.read_geometry(str(surf_path))
    label_ids, ctab, names = nib.freesurfer.read_annot(str(annot_path))

    # 按行索引 i 建立: i -> (name, r, g, b)
    label_info = {}
    for i in range(len(ctab)):
        r, g, b, a = ctab[i][0], ctab[i][1], ctab[i][2], ctab[i][3]
        name = names[i].decode("utf-8", errors="replace") if isinstance(names[i], bytes) else str(names[i])
        label_info[i] = (name, r / 255.0, g / 255.0, b / 255.0)

    default_color = np.array([0.3, 0.3, 0.3], dtype=np.float32)

    vertex_colors = np.zeros((len(verts), 3), dtype=np.float32)
    for vidx, row_idx in enumerate(label_ids):
        if row_idx in label_info:
            _, r, g, b = label_info[row_idx]
            vertex_colors[vidx] = [r, g, b]
        else:
            vertex_colors[vidx] = default_color

    out_path = MODELS_DIR / f"brain_{hemi}_{atlas_id}.obj"
    write_colored_obj(verts, faces, vertex_colors, out_path)

    label_list = []
    # 跳过索引 0，它通常是 unknown/背景
    for row_idx in range(1, len(ctab)):
        name, r, g, b = label_info[row_idx]
        if name.lower() in ("unknown", "corpuscallosum", "unknown_segment"):
            continue
        hex_color = "#{:02X}{:02X}{:02X}".format(
            int(r * 255), int(g * 255), int(b * 255)
        )
        label_list.append({
            "label_id": row_idx,  # 行索引，与顶点 label_ids 一致
            "name": name,
            "color": hex_color,
            "hemi": hemi,
        })
    return label_list


def main():
    subjects_dir = TMP_DIR
    subjects_dir.mkdir(exist_ok=True)

    ensure_fsaverage(subjects_dir)
    ensure_hcp_mmp(subjects_dir)

    fsaverage = subjects_dir / "fsaverage"
    print("[3/3] 生成顶点着色 OBJ 模型...")

    all_atlas_labels = {}

    for atlas_id, cfg in ATLASES.items():
        annot_name = cfg["annot"]
        print(f"\n  📦 {atlas_id} ({annot_name})")

        atlas_labels = []
        for hemi in ("lh", "rh"):
            surf_path = fsaverage / "surf" / f"{hemi}.pial"
            annot_path = fsaverage / "label" / f"{hemi}.{annot_name}.annot"

            if not annot_path.exists():
                print(f"    ⚠ 缺少 {annot_path.name}，跳过")
                continue

            labels = generate_hemi_obj(hemi, surf_path, annot_path, atlas_id)
            atlas_labels.extend(labels)

        all_atlas_labels[atlas_id] = atlas_labels

    colors_js_path = MODELS_DIR / "atlas_colors.json"
    with open(colors_js_path, "w", encoding="utf-8") as f:
        json.dump(all_atlas_labels, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 完成！颜色表: {colors_js_path}")
    print(f"   OBJ 模型: {MODELS_DIR}/")


if __name__ == "__main__":
    main()
