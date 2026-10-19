"""
Membuat public/models/model.glb (robot sederhana) tanpa software 3D eksternal.

Isi GLB:
- hierarchy node:  Robot > Body > (Head > Eye), (LeftArm, RightArm), (LeftLeg, RightLeg)
- 4 material PBR (metallicRoughness), satu material dipakai bersama oleh 4 mesh
- 4 animation clip: Idle, Walk, Run, Wave

Jalankan:  python3 tools/make_model.py
"""
import json
import math
import os
import struct

# ---------------------------------------------------------------- buffer util
bin_data = bytearray()
buffer_views = []
accessors = []


def _align():
    while len(bin_data) % 4:
        bin_data.append(0)


def add_accessor(values, comp_type, count, fmt, target=None, with_minmax=False):
    """values: list datar float / int. fmt: 'f' (float32) atau 'H' (uint16)."""
    _align()
    offset = len(bin_data)
    raw = struct.pack("<%d%s" % (len(values), fmt), *values)
    bin_data.extend(raw)
    view = {"buffer": 0, "byteOffset": offset, "byteLength": len(raw)}
    if target:
        view["target"] = target
    buffer_views.append(view)
    acc = {
        "bufferView": len(buffer_views) - 1,
        "componentType": 5126 if fmt == "f" else 5123,
        "count": count,
        "type": comp_type,
    }
    if with_minmax:
        n = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[comp_type]
        cols = [values[i::n] for i in range(n)]
        acc["min"] = [min(c) for c in cols]
        acc["max"] = [max(c) for c in cols]
    accessors.append(acc)
    return len(accessors) - 1


# ---------------------------------------------------------------- geometri box
# (normal, u, v) dengan u x v = normal  -> winding CCW jika dilihat dari luar
FACES = [
    ((1, 0, 0), (0, 1, 0), (0, 0, 1)),
    ((-1, 0, 0), (0, 0, 1), (0, 1, 0)),
    ((0, 1, 0), (0, 0, 1), (1, 0, 0)),
    ((0, -1, 0), (1, 0, 0), (0, 0, 1)),
    ((0, 0, 1), (1, 0, 0), (0, 1, 0)),
    ((0, 0, -1), (0, 1, 0), (1, 0, 0)),
]
CORNERS = [(-1, -1), (1, -1), (1, 1), (-1, 1)]


def box_primitive(size, material):
    h = [s / 2 for s in size]
    pos, nor, idx = [], [], []
    for n, u, v in FACES:
        base = len(pos) // 3
        for a, b in CORNERS:
            for i in range(3):
                pos.append(n[i] * h[i] + a * u[i] * h[i] + b * v[i] * h[i])
            nor.extend(n)
        idx.extend([base, base + 1, base + 2, base, base + 2, base + 3])
    a_pos = add_accessor(pos, "VEC3", len(pos) // 3, "f", 34962, True)
    a_nor = add_accessor(nor, "VEC3", len(nor) // 3, "f", 34962)
    a_idx = add_accessor(idx, "SCALAR", len(idx), "H", 34963)
    return {
        "attributes": {"POSITION": a_pos, "NORMAL": a_nor},
        "indices": a_idx,
        "material": material,
        "mode": 4,
    }


# ---------------------------------------------------------------- material
materials = [
    {"name": "BodyPaint", "pbrMetallicRoughness": {
        "baseColorFactor": [0.15, 0.45, 0.85, 1.0], "metallicFactor": 0.7, "roughnessFactor": 0.35}},
    {"name": "HeadMetal", "pbrMetallicRoughness": {
        "baseColorFactor": [0.85, 0.87, 0.90, 1.0], "metallicFactor": 1.0, "roughnessFactor": 0.2}},
    {"name": "Limb", "pbrMetallicRoughness": {  # dipakai bersama oleh 4 mesh (tangan & kaki)
        "baseColorFactor": [0.20, 0.22, 0.27, 1.0], "metallicFactor": 0.6, "roughnessFactor": 0.5}},
    {"name": "EyeGlow", "pbrMetallicRoughness": {
        "baseColorFactor": [0.02, 0.10, 0.12, 1.0], "metallicFactor": 0.0, "roughnessFactor": 0.4},
     "emissiveFactor": [0.1, 0.9, 1.0]},
]
M_BODY, M_HEAD, M_LIMB, M_EYE = 0, 1, 2, 3

# ---------------------------------------------------------------- mesh
meshes = []


def add_mesh(name, size, material):
    meshes.append({"name": name, "primitives": [box_primitive(size, material)]})
    return len(meshes) - 1


# ---------------------------------------------------------------- node
nodes = []


def add_node(name, translation=None, mesh=None, children=None):
    n = {"name": name}
    if translation:
        n["translation"] = list(translation)
    if mesh is not None:
        n["mesh"] = mesh
    if children:
        n["children"] = children
    nodes.append(n)
    return len(nodes) - 1


# dibangun dari daun ke akar supaya index children sudah diketahui.
# Node "pivot" (LeftArm, LeftLeg, ...) berada di sendi, mesh-nya di child
# dengan offset, sehingga rotasi pivot memutar anggota badan di sekitar sendi.
eye = add_node("Eye", (0, 0.04, 0.21), add_mesh("EyeMesh", (0.30, 0.08, 0.02), M_EYE))
head = add_node("Head", (0, 0.62, 0), add_mesh("HeadMesh", (0.45, 0.40, 0.40), M_HEAD), [eye])

l_arm_mesh = add_node("LeftArmMesh", (0, -0.35, 0), add_mesh("LeftArmGeo", (0.20, 0.70, 0.20), M_LIMB))
r_arm_mesh = add_node("RightArmMesh", (0, -0.35, 0), add_mesh("RightArmGeo", (0.20, 0.70, 0.20), M_LIMB))
l_arm = add_node("LeftArm", (-0.50, 0.35, 0), None, [l_arm_mesh])
r_arm = add_node("RightArm", (0.50, 0.35, 0), None, [r_arm_mesh])

l_leg_mesh = add_node("LeftLegMesh", (0, -0.30, 0), add_mesh("LeftLegGeo", (0.22, 0.60, 0.25), M_LIMB))
r_leg_mesh = add_node("RightLegMesh", (0, -0.30, 0), add_mesh("RightLegGeo", (0.22, 0.60, 0.25), M_LIMB))
l_leg = add_node("LeftLeg", (-0.18, -0.40, 0), None, [l_leg_mesh])
r_leg = add_node("RightLeg", (0.18, -0.40, 0), None, [r_leg_mesh])

body = add_node("Body", (0, 1.0, 0), add_mesh("TorsoMesh", (0.70, 0.80, 0.40), M_BODY),
                [head, l_arm, r_arm, l_leg, r_leg])
robot = add_node("Robot", None, None, [body])


# ---------------------------------------------------------------- animasi
def qx(deg):
    a = math.radians(deg) / 2
    return [math.sin(a), 0, 0, math.cos(a)]


def qy(deg):
    a = math.radians(deg) / 2
    return [0, math.sin(a), 0, math.cos(a)]


def qz(deg):
    a = math.radians(deg) / 2
    return [0, 0, math.sin(a), math.cos(a)]


def flat(rows):
    return [x for r in rows for x in r]


def make_clip(name, channels):
    """channels: list of (node, path, times, rows)"""
    samplers, chans = [], []
    for node, path, times, rows in channels:
        t_acc = add_accessor(times, "SCALAR", len(times), "f", None, True)
        v_acc = add_accessor(flat(rows), "VEC4" if path == "rotation" else "VEC3", len(rows), "f")
        samplers.append({"input": t_acc, "output": v_acc, "interpolation": "LINEAR"})
        chans.append({"sampler": len(samplers) - 1, "target": {"node": node, "path": path}})
    return {"name": name, "samplers": samplers, "channels": chans}


def bob(y0, y1, n):
    return [[0, y0 if i % 2 == 0 else y1, 0] for i in range(n)]


def quarter_times(period):
    return [0, period * 0.25, period * 0.5, period * 0.75, period]


animations = []

# Idle: bernapas pelan, kepala menoleh kiri-kanan
t = [0, 0.5, 1.0, 1.5, 2.0]
animations.append(make_clip("Idle", [
    (body, "translation", [0, 1.0, 2.0], [[0, 1.0, 0], [0, 1.02, 0], [0, 1.0, 0]]),
    (head, "rotation", t, [qy(0), qy(10), qy(0), qy(-10), qy(0)]),
    (l_arm, "rotation", [0, 1.0, 2.0], [qx(3), qx(-3), qx(3)]),
    (r_arm, "rotation", [0, 1.0, 2.0], [qx(-3), qx(3), qx(-3)]),
]))

# Walk: ayunan kaki & tangan berlawanan, badan naik-turun
t = quarter_times(1.0)
animations.append(make_clip("Walk", [
    (l_leg, "rotation", t, [qx(30), qx(0), qx(-30), qx(0), qx(30)]),
    (r_leg, "rotation", t, [qx(-30), qx(0), qx(30), qx(0), qx(-30)]),
    (l_arm, "rotation", t, [qx(-25), qx(0), qx(25), qx(0), qx(-25)]),
    (r_arm, "rotation", t, [qx(25), qx(0), qx(-25), qx(0), qx(25)]),
    (body, "translation", t, bob(1.0, 1.04, 5)),
]))

# Run: ayunan lebih besar, siklus lebih cepat, badan condong ke depan
t = quarter_times(0.6)
animations.append(make_clip("Run", [
    (l_leg, "rotation", t, [qx(55), qx(0), qx(-55), qx(0), qx(55)]),
    (r_leg, "rotation", t, [qx(-55), qx(0), qx(55), qx(0), qx(-55)]),
    (l_arm, "rotation", t, [qx(-60), qx(0), qx(60), qx(0), qx(-60)]),
    (r_arm, "rotation", t, [qx(60), qx(0), qx(-60), qx(0), qx(60)]),
    (body, "translation", t, bob(1.0, 1.10, 5)),
    (body, "rotation", [0, 0.6], [qx(12), qx(12)]),
]))

# Wave: tangan kanan melambai (dipakai Challenge B: click -> animasi)
animations.append(make_clip("Wave", [
    (r_arm, "rotation", [0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.4],
     [qz(0), qz(150), qz(120), qz(160), qz(120), qz(160), qz(150), qz(0)]),
]))

# ---------------------------------------------------------------- tulis GLB
gltf = {
    "asset": {"version": "2.0", "generator": "tools/make_model.py"},
    "scene": 0,
    "scenes": [{"name": "Scene", "nodes": [robot]}],
    "nodes": nodes,
    "meshes": meshes,
    "materials": materials,
    "animations": animations,
    "accessors": accessors,
    "bufferViews": buffer_views,
    "buffers": [{"byteLength": 0}],
}
_align()
gltf["buffers"][0]["byteLength"] = len(bin_data)

json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
while len(json_bytes) % 4:
    json_bytes += b" "

total = 12 + 8 + len(json_bytes) + 8 + len(bin_data)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "models", "model.glb")
with open(out, "wb") as f:
    f.write(struct.pack("<III", 0x46546C67, 2, total))            # header 'glTF', v2
    f.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))      # chunk JSON
    f.write(json_bytes)
    f.write(struct.pack("<II", len(bin_data), 0x004E4942))        # chunk BIN
    f.write(bin_data)

print("OK ->", os.path.abspath(out), total, "bytes")
print("nodes:", len(nodes), "| meshes:", len(meshes), "| clips:", [a["name"] for a in animations])
