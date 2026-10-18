#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NeuroViz 网格管线：把体素标签图 → 每脑区独立 mz3 网格 + meta.csv
================================================================
输入：docs/data/atlas_{dk68,destrieux148,hcp360,aal116}.nii.gz + .json
输出：docs/static/atlas_xxx/{region_<id>.mz3, meta.csv}

流程（每个区域）：
  二值掩膜 → 填洞 → 裁剪到包围盒 → Marching Cubes → 世界坐标(RAS mm)
  → 网格坍缩简化（按各图谱保留率）→ 写 mz3（含逐顶点 RGBA）

简化算法：顶点栅格坍缩（自实现，无第三方简化依赖）
  保留率: dk68 0.40 / destrieux148 0.35 / hcp360 0.20
"""
import json, struct, csv, sys
from pathlib import Path
import numpy as np
import nibabel as nib
from scipy import ndimage
from skimage import measure

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "docs" / "data"
STATIC = ROOT / "docs" / "static"

# 各图谱的目标三角面保留率（越大保留越少）
RETENTION = {"dk68": 0.40, "destrieux148": 0.35, "hcp360": 0.20, "aal116": 0.30, "subcortical": 0.35}
ATLASES = ["dk68", "destrieux148", "hcp360", "aal116", "subcortical"]

def write_mz3(path, verts, faces, rgba):
    """写 FreeSurfer/NiiVue 兼容 mz3（float32 顶点 + int32 面 + RGBA 颜色）"""
    nv = len(verts) // 3
    nf = len(faces) // 3
    flags = 1 | 2 | 4  # indices + vertices + RGBA colors
    header = struct.pack("<HHIII", 23117, flags, nf, nv, 0)  # nface 必须是三角形数，不是索引数
    with open(path, "wb") as f:
        f.write(header)
        f.write(np.asarray(faces, dtype=np.uint32).tobytes())
        f.write(np.asarray(verts, dtype=np.float32).tobytes())
        f.write(np.asarray(rgba, dtype=np.uint8).tobytes())

def simplify_grid(verts, faces, target_retention):
    """栅格坍缩简化：把靠得近的顶点合并，返回简化后的 verts/faces"""
    if target_retention >= 0.99 or len(faces) < 100:
        return verts, faces
    v = np.asarray(verts, dtype=np.float64).reshape(-1, 3)
    f = np.asarray(faces, dtype=np.int64).reshape(-1, 3)
    extent = v.max(0) - v.min(0)
    diag = float(np.linalg.norm(extent))
    # 二分搜索栅格大小，使面数接近目标保留率
    lo, hi = diag * 0.0005, diag * 0.05
    best = None
    for _ in range(12):
        h = (lo + hi) / 2
        key = np.floor((v - v.min(0)) / h).astype(np.int64)
        _, inv = np.unique(key, axis=0, return_inverse=True)
        newf = inv[f]
        keep = (newf[:, 0] != newf[:, 1]) & (newf[:, 1] != newf[:, 2]) & (newf[:, 0] != newf[:, 2])
        ratio = keep.sum() / max(len(f), 1)
        best = (h, inv, newf[keep], keep)
        if ratio > target_retention:
            lo = h
        else:
            hi = h
        if abs(ratio - target_retention) < 0.03:
            break
    h, inv, newf, keep = best
    # 新顶点 = 每个栅格单元的坐标均值
    ncell = inv.max() + 1
    sums = np.zeros((ncell, 3)); cnts = np.zeros(ncell)
    np.add.at(sums, inv, v)
    np.add.at(cnts, inv, 1)
    newv = sums / np.maximum(cnts[:, None], 1)
    return newv.reshape(-1), newf.reshape(-1)

def region_mesh(mask, affine, retention, min_voxels=20):
    """单个区域：掩膜 → 网格（RAS mm 坐标）"""
    if mask.sum() < min_voxels:
        return None, None
    mask = ndimage.binary_fill_holes(mask)
    # 裁剪到包围盒加速
    idx = np.array(np.where(mask))
    pad = 2
    slices = tuple(slice(max(0, idx[d].min() - pad), idx[d].max() + pad + 1) for d in range(3))
    sub = mask[slices]
    try:
        verts, faces, _, _ = measure.marching_cubes(sub.astype(np.float32), level=0.5)
    except Exception:
        return None, None
    # 体素坐标 → 裁剪空间偏移 → 世界坐标(RAS mm)
    origin = np.array([s.start for s in slices], dtype=np.float64)
    verts_world = nib.affines.apply_affine(affine, verts + origin)
    faces_flat = faces.reshape(-1)
    verts_flat, faces_flat = simplify_grid(verts_world.reshape(-1), faces_flat, retention)
    return verts_flat, faces_flat

def main():
    for atlas in ATLASES:
        nii_path = DATA / f"atlas_{atlas}.nii.gz"
        json_path = DATA / f"atlas_{atlas}.json"
        if not nii_path.exists() or not json_path.exists():
            print(f"⚠ 跳过 {atlas}（数据不存在）")
            continue
        out_dir = STATIC / f"atlas_{atlas}"
        out_dir.mkdir(parents=True, exist_ok=True)
        vol = nib.load(str(nii_path))
        data = vol.get_fdata().astype(np.int32)
        affine = vol.affine
        meta = json.loads(json_path.read_text(encoding="utf-8"))
        rows, ok, skip = [], 0, 0
        total_faces = 0
        for reg in meta["regions"]:
            rid = int(reg["id"])
            mask = (data == rid)
            verts, faces = region_mesh(mask, affine, RETENTION.get(atlas, 0.3))
            if verts is None:
                skip += 1
                continue
            r, g, b = reg["color"]
            nv = len(verts) // 3
            rgba = np.tile(np.array([r, g, b, 255], dtype=np.uint8), (nv, 1))
            fname = f"region_{rid}.mz3"
            write_mz3(out_dir / fname, verts, faces, rgba)
            cx, cy, cz = reg.get("centroid_mm", [0, 0, 0])
            rows.append({"id": rid, "name_zh": reg["name_zh"], "name_en": reg["name_en"],
                         "r": r, "g": g, "b": b, "filename": fname,
                         "centroid_x": cx, "centroid_y": cy, "centroid_z": cz,
                         "volume_mm3": reg.get("volume_mm3", "")})
            total_faces += len(faces) // 3
            ok += 1
        with open(out_dir / "meta.csv", "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["id", "name_zh", "name_en", "r", "g", "b",
                                              "filename", "centroid_x", "centroid_y", "centroid_z", "volume_mm3"])
            w.writeheader()
            w.writerows(rows)
        print(f"✓ {atlas}: {ok} 个脑区网格, {skip} 个过小跳过, 共 {total_faces} 三角面 -> static/{atlas}/")

if __name__ == "__main__":
    main()
