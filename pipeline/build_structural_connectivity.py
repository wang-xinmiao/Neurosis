#!/usr/bin/env python3
"""Build an ROI x ROI structural connectivity matrix from TRX group labels.

Method:
1. Read streamline positions and offsets from the TRX archive.
2. Select the eight major bundle groups used by the web application.
3. Map each streamline endpoint to the nearest non-zero AAL116 voxel within
   8 mm in MNI space.
4. Count mapped endpoint label pairs for the combined set and for each bundle.

These are raw streamline counts for a population tractography atlas. They are
not individual-subject probabilities, FA values, or clinical measurements.
"""

from __future__ import annotations

import json
import pathlib
import zipfile

import nibabel as nib
import numpy as np


ROOT = pathlib.Path(__file__).resolve().parent.parent
TRX = ROOT / "docs/data/tracts/yeh2022.trx"
ATLAS_NII = ROOT / "docs/data/atlas_aal116.nii.gz"
ATLAS_JSON = ROOT / "docs/data/atlas_aal116.json"
OUTPUT = ROOT / "docs/data/structural_connectivity.json"

BUNDLE_GROUPS = {
    "arcuate": ["AF_L", "AF_R"],
    "cingulum": ["CB_L", "CB_R"],
    "cst": ["CST_L", "CST_R"],
    "ilf": ["ILF_L", "ILF_R"],
    "slf": ["SLF1_L", "SLF1_R", "SLF2_L", "SLF2_R", "SLF3_L", "SLF3_R"],
    "uncinate": ["UF_L", "UF_R"],
    "corpusCallosum": ["CC"],
    "ifof": ["IFOF_L", "IFOF_R"],
}


def load_trx(path: pathlib.Path) -> tuple[np.ndarray, np.ndarray, dict[str, np.ndarray]]:
    """Read little-endian TRX positions, offsets and streamline groups."""
    with zipfile.ZipFile(path) as archive:
        offsets = np.frombuffer(
            archive.read("offsets.int32"), dtype="<i4"
        ).astype(np.int64)
        points = np.frombuffer(
            archive.read("positions.3.float32"), dtype="<f4"
        ).reshape(-1, 3)
        groups: dict[str, np.ndarray] = {}
        for name in archive.namelist():
            if not name.startswith("groups/") or name.endswith("/"):
                continue
            group_id = pathlib.PurePosixPath(name).name.split(".")[0]
            groups[group_id] = np.frombuffer(
                archive.read(name), dtype="<u4"
            ).astype(np.int64)
    return points, offsets, groups


def nearest_label_indices(
    points: np.ndarray,
    labels: np.ndarray,
    affine: np.ndarray,
    radius_mm: float,
) -> np.ndarray:
    """Find the closest non-zero atlas label for each world-space point."""
    inverse = np.linalg.inv(affine)
    homogeneous = np.column_stack([points, np.ones(len(points))])
    voxel_coords = (inverse @ homogeneous.T).T[:, :3]
    result = np.zeros(len(points), dtype=np.int32)

    min_voxel_mm = min(
        np.linalg.norm(affine[:3, 0]),
        np.linalg.norm(affine[:3, 1]),
        np.linalg.norm(affine[:3, 2]),
    )
    step = max(1, int(round(radius_mm / min_voxel_mm)))
    offsets = [
        (dx * dx + dy * dy + dz * dz, dx, dy, dz)
        for dx in range(-step, step + 1)
        for dy in range(-step, step + 1)
        for dz in range(-step, step + 1)
    ]
    offsets.sort()

    for point_index, coord in enumerate(voxel_coords):
        base = np.rint(coord).astype(int)
        for _, dx, dy, dz in offsets:
            index = base + np.array([dx, dy, dz])
            if np.any(index < 0) or np.any(index >= labels.shape):
                continue
            label_id = int(labels[tuple(index)])
            if label_id > 0:
                result[point_index] = label_id
                break
    return result


def matrix_from_edges(
    edges: dict[tuple[int, int], int],
    count: int,
) -> list[list[int]]:
    matrix = [[0 for _ in range(count)] for _ in range(count)]
    for (source, target), value in edges.items():
        matrix[source][target] = value
        matrix[target][source] = value
    return matrix


def main() -> None:
    points, offsets, groups = load_trx(TRX)
    atlas_image = nib.load(str(ATLAS_NII))
    labels = np.asarray(atlas_image.dataobj).astype(np.int32)
    atlas_meta = json.loads(ATLAS_JSON.read_text(encoding="utf-8"))
    regions = atlas_meta["regions"]
    id_to_index = {int(region["id"]): index for index, region in enumerate(regions)}

    category_streamlines = {
        bundle: np.unique(np.concatenate([groups[group_id] for group_id in group_ids]))
        for bundle, group_ids in BUNDLE_GROUPS.items()
    }
    all_streamlines = np.unique(
        np.concatenate(list(category_streamlines.values()))
    )

    endpoints = []
    valid_streamlines = []
    for streamline_id in all_streamlines:
        start = offsets[streamline_id]
        end = offsets[streamline_id + 1]
        if end - start < 2:
            continue
        valid_streamlines.append(int(streamline_id))
        endpoints.extend([points[start], points[end - 1]])

    endpoint_labels = nearest_label_indices(
        np.asarray(endpoints, dtype=np.float32),
        labels,
        atlas_image.affine,
        radius_mm=8.0,
    )
    streamline_labels: dict[int, tuple[int, int]] = {}
    for position, streamline_id in enumerate(valid_streamlines):
        source_id = int(endpoint_labels[position * 2])
        target_id = int(endpoint_labels[position * 2 + 1])
        source = id_to_index.get(source_id)
        target = id_to_index.get(target_id)
        if source is None or target is None or source == target:
            continue
        streamline_labels[streamline_id] = (min(source, target), max(source, target))

    combined_edges: dict[tuple[int, int], int] = {}
    bundle_output: dict[str, dict] = {}
    for bundle, streamline_ids in category_streamlines.items():
        edges: dict[tuple[int, int], int] = {}
        for streamline_id in streamline_ids:
            pair = streamline_labels.get(int(streamline_id))
            if pair is None:
                continue
            edges[pair] = edges.get(pair, 0) + 1
            combined_edges[pair] = combined_edges.get(pair, 0) + 1
        bundle_output[bundle] = {
            "streamlines": int(len(streamline_ids)),
            "mappedStreamlines": int(sum(edges.values())),
            "edges": [
                [source, target, count]
                for (source, target), count in sorted(edges.items())
            ],
        }

    region_count = len(regions)
    payload = {
        "schemaVersion": 1,
        "atlas": {
            "id": "aal116",
            "name": atlas_meta.get("name", "AAL116"),
            "citation": atlas_meta.get("citation", ""),
            "regionCount": region_count,
        },
        "source": {
            "file": "tracts/yeh2022.trx",
            "citation": "Yeh et al., PMID: 35995773",
        },
        "method": {
            "description": (
                "Streamline endpoints were mapped to the nearest non-zero "
                "AAL116 voxel within 8 mm in MNI space."
            ),
            "endpointRadiusMm": 8,
            "weights": "raw mapped streamline counts",
        },
        "summary": {
            "selectedStreamlines": int(len(all_streamlines)),
            "validStreamlines": int(len(valid_streamlines)),
            "mappedStreamlines": int(sum(combined_edges.values())),
            "connectionCount": int(len(combined_edges)),
        },
        "regions": [
            {
                "index": index,
                "id": int(region["id"]),
                "name": region.get("name_zh") or region.get("name_en") or "",
                "nameEn": region.get("name_en", ""),
                "color": region.get("color", [120, 144, 156]),
                "centroidMm": region.get("centroid_mm", [0, 0, 0]),
            }
            for index, region in enumerate(regions)
        ],
        "matrix": matrix_from_edges(combined_edges, region_count),
        "bundles": bundle_output,
        "caution": (
            "Population-atlas demonstration only. Raw streamline counts are "
            "not individual-subject probabilities or clinical measurements."
        ),
    }
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(
        f"Wrote {OUTPUT} | region={region_count} "
        f"selected={len(all_streamlines)} mapped={sum(combined_edges.values())} "
        f"pairs={len(combined_edges)}"
    )


if __name__ == "__main__":
    main()
