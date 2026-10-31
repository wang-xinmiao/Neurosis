#!/usr/bin/env python3
"""Merge HCP cortical region meshes into one lightweight shell for NiiVue.

Keeping all cortical parcels as separate NiiVue meshes is useful for region
picking, but expensive when the structural module is not active. The white
matter module uses one merged translucent mesh as spatial context for fibers.
"""

from __future__ import annotations

import pathlib
import struct

import numpy as np


ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs/static/atlas_hcp360"
OUTPUT = SOURCE / "cortex_shell.mz3"


def read_mz3(path: pathlib.Path):
    payload = path.read_bytes()
    magic, flags, face_count, vertex_count, _ = struct.unpack_from("<HHIII", payload, 0)
    if magic != 23117 or not (flags & 1 and flags & 2 and flags & 4):
        raise ValueError(f"Unsupported MZ3 mesh: {path.name}")
    offset = 16
    faces = np.frombuffer(
        payload, dtype="<u4", count=face_count * 3, offset=offset
    ).reshape(-1, 3)
    offset += face_count * 3 * 4
    vertices = np.frombuffer(
        payload, dtype="<f4", count=vertex_count * 3, offset=offset
    ).reshape(-1, 3)
    offset += vertex_count * 3 * 4
    colors = np.frombuffer(
        payload, dtype=np.uint8, count=vertex_count * 4, offset=offset
    ).reshape(-1, 4)
    return faces, vertices, colors


def write_mz3(path: pathlib.Path, vertices, faces, colors) -> None:
    face_count = len(faces)
    vertex_count = len(vertices)
    flags = 1 | 2 | 4
    header = struct.pack("<HHIII", 23117, flags, face_count, vertex_count, 0)
    with path.open("wb") as stream:
        stream.write(header)
        stream.write(np.asarray(faces, dtype="<u4").tobytes())
        stream.write(np.asarray(vertices, dtype="<f4").tobytes())
        stream.write(np.asarray(colors, dtype=np.uint8).tobytes())


def mesh_number(path: pathlib.Path) -> int:
    return int(path.stem.split("_")[-1])


def main() -> None:
    mesh_paths = sorted(SOURCE.glob("region_*.mz3"), key=mesh_number)
    if not mesh_paths:
        raise RuntimeError(f"No region meshes found in {SOURCE}")

    all_faces = []
    all_vertices = []
    all_colors = []
    vertex_offset = 0
    for path in mesh_paths:
        faces, vertices, colors = read_mz3(path)
        all_faces.append(faces + vertex_offset)
        all_vertices.append(vertices)
        all_colors.append(colors)
        vertex_offset += len(vertices)

    write_mz3(
        OUTPUT,
        np.concatenate(all_vertices, axis=0),
        np.concatenate(all_faces, axis=0),
        np.concatenate(all_colors, axis=0),
    )
    print(
        f"Wrote {OUTPUT} | meshes={len(mesh_paths)} "
        f"vertices={vertex_offset} "
        f"triangles={sum(len(faces) for faces in all_faces)}"
    )


if __name__ == "__main__":
    main()
