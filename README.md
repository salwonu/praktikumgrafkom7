# Interactive 3D Prototype — Praktikum Grafika Komputer Pertemuan 7

| | |
|---|---|
| **Mata Kuliah** | EF234504 — Grafika Komputer |
| **Judul Prototype** | Robot Playground — Interactive 3D Prototype |

Nama Anggota:
- Nadine Aulia Putri Fanani [5025231206]
- Salwa Fitri Fadiyah Hanan [5025231220]

## Deskripsi Aplikasi

Aplikasi web 3D interaktif berbasis Vite + Three.js. Di dalam satu scene terdapat
demo hierarchy parent-child, galeri material PBR, tata surya hierarkis, dan sebuah
robot (model GLB) yang dapat dianimasikan. Pengguna dapat mengorbit kamera, melihat
objek yang di-hover, memilih objek dengan klik, dan melihat informasi objek terpilih
pada HUD serta panel informasi. Environment lighting dapat dihidup/matikan untuk
membandingkan respons material PBR.

## Struktur Scene Graph

```
Scene
├── Camera (PerspectiveCamera + OrbitControls)
├── AmbientLight
├── DirectionalLight (castShadow)
├── Environment (scene.environment = RoomEnvironment via PMREM)
├── Ground (PlaneGeometry, MeshStandardMaterial) + GridHelper
├── Hierarchy Demo (THREE.Group)
│   └── Parent Box
│       ├── AxesHelper
│       └── Child Sphere
├── PBR Gallery (THREE.Group)
│   └── 9 Sphere  (roughness 0.1/0.5/0.9  x  metalness 0/0.5/1)
├── Solar System (THREE.Group)
│   └── Sun
│       └── Earth Orbit
│           └── Earth
│               └── Moon Orbit
│                   └── Moon
└── Imported GLB (Robot)
    └── Body
        ├── Head └── Eye
        ├── LeftArm  └── LeftArmMesh
        ├── RightArm └── RightArmMesh
        ├── LeftLeg  └── LeftLegMesh
        └── RightLeg └── RightLegMesh
```

## Hierarchy Parent-Child

- `Hierarchy Demo` adalah `THREE.Group`; memindahkannya (tombol **G**) membuat semua child ikut bergerak.
- `Child Sphere` adalah child dari `Parent Box` dengan **local position tetap** `(1.40, 0.20, 0.00)`.
  Parent berputar dan bergeser (tombol **P** untuk jeda), sehingga **world position** child terus berubah.
  Keduanya ditampilkan langsung di HUD (`Local` vs `World`).
- Challenge D memakai hierarchy `Sun → Earth Orbit → Earth → Moon Orbit → Moon`;
  yang diputar hanya node orbit, tidak ada world position yang dihitung manual.

## Model GLB yang Digunakan

`public/models/model.glb` — robot dengan 12 node dan 7 mesh.

## Sumber Asset

Dibuat sendiri (original) menggunakan script `tools/make_model.py` (Python, tanpa dependency),
sehingga tidak ada masalah lisensi. Untuk membuat ulang: `python3 tools/make_model.py`.
Environment memakai `RoomEnvironment` bawaan Three.js (procedural), tidak memerlukan file eksternal.
Folder `public/environment/` disediakan jika ingin memakai gambar panorama sendiri.

## Animation Clip yang Digunakan

| Clip | Durasi | Keterangan |
|---|---|---|
| `Idle` | 2.0 s | napas pelan + kepala menoleh (default saat load) |
| `Walk` | 1.0 s | ayunan kaki/tangan berlawanan |
| `Run` | 0.6 s | ayunan lebih besar, badan condong |
| `Wave` | 2.4 s | tangan kanan melambai, jalan sekali (`LoopOnce`) |

Satu `AnimationMixer` mengelola keempat `AnimationAction`; `mixer.update(delta)` dipanggil setiap frame.

## PBR Material

Semua objek memakai `MeshStandardMaterial`.

### Roughness

Galeri: 0.1 (mengkilap), 0.5, 0.9 (kasar/buram). Ground: 0.85. Parent Box: 0.35.

### Metalness

Galeri: 0 (non-logam), 0.5, 1 (logam penuh). Ground: 0. Kepala robot: 1.0, badan robot: 0.7.

Sphere pada galeri memakai warna sama (emas `#d9a441`); perbedaan tampilannya murni dari roughness dan metalness.

## Jenis Interaction

- Orbit/zoom/pan kamera (`OrbitControls`, ada batas jarak dan sudut polar).
- Hover dan click pada objek (Raycaster, recursive).
- Keyboard: `1` Idle, `2` Walk, `3` Run, `E` environment ON/OFF, `P` jeda gerak parent, `G` goyang group.

Pipeline: pointer (piksel) → NDC (−1…+1) → `raycaster.setFromCamera` →
`intersectObjects(interactiveObjects, true)` → `findSelectableRoot()` → state hover/selected.

## Hover Feedback

Objek di bawah pointer diberi glow emissive biru muda, skala naik ±8% (dengan lerp halus),
cursor menjadi pointer, dan namanya muncul di HUD (`Hover:`). Untuk model GLB, HUD juga
menampilkan nama mesh child yang terkena ray.

## Click Feedback

Objek terpilih: glow emissive kuning, skala ±12%, berputar perlahan memakai delta time
(Challenge G), dan detailnya tampil di panel informasi. Klik di area kosong membatalkan selection.
Klik pada robot juga memainkan animasi `Wave` (Challenge B). Drag untuk orbit **tidak** mengubah selection.

## Environment

`scene.environment` diisi hasil `PMREMGenerator.fromScene(new RoomEnvironment())`, sedangkan
`scene.background` tetap warna solid `#0b1020`, sehingga terlihat bahwa keduanya dua hal berbeda.
Tombol **E** menonaktifkan environment (HUD: `Environment: OFF`); material metal terlihat jauh lebih gelap.

## Challenge yang Dikerjakan

| Challenge | Status | Implementasi |
|---|---|---|
| A — Multiple Animation Clips | ✅ | Tombol 1/2/3, `fadeIn`/`fadeOut` antar action |
| B — Click Menjalankan Animasi | ✅ | Klik robot → select + clip `Wave` lalu kembali ke clip dasar |
| C — Information Panel | ✅ | Name, Position, Rotation, Scale, Material Type |
| D — Hierarchical Solar System | ✅ | Sun → Earth Orbit → Earth → Moon Orbit → Moon |
| E — PBR Material Gallery | ✅ | Grid 3×3 sphere |
| F — Hover Emissive | ✅ | Material di-clone per mesh saat feedback; material asli tidak diubah |
| G — Selection Rotation | ✅ | `rotation.y += speed * delta` hanya untuk objek terpilih |
| H — Environment Toggle | ✅ | Tombol E + indikator HUD |

## Cara Menjalankan

```bash
npm install
npm run dev
```

Lalu buka alamat yang ditampilkan Vite (biasanya http://localhost:5173).

## Catatan Debugging

- **Hit pada child mesh GLB.** Raycast recursive mengenai mesh kecil (mis. `LeftArmMesh`), bukan root.
  Diselesaikan dengan `userData.selectable` pada root dan `findSelectableRoot()` yang naik lewat `parent`.
- **Material dipakai bersama.** Material `Limb` dipakai 4 mesh. Mengubah `emissive` langsung akan mengubah
  semuanya. Diselesaikan dengan meng-clone material per mesh dan menukar kembali ke material asli saat state `none`.
- **Click vs drag.** Drag orbit juga memicu event `click`. Diselesaikan dengan melacak jarak gerakan
  sejak `pointerdown` (ambang 5 px) sehingga selection hanya terjadi pada klik tanpa drag.
- **Loading asynchronous.** Logika yang membutuhkan model (mixer, selectable, shadow) dijalankan di dalam
  callback `loader.load`, bukan setelah pemanggilannya.
- **Skala dan hierarchy.** Scale feedback pada `Sun` akan ikut mengubah jarak orbit Earth/Moon karena mereka
  descendant-nya, sehingga Sun/Earth/Moon hanya memakai feedback emissive (`noScale`).
- **Helper ikut terkena ray.** `AxesHelper` dinonaktifkan dari raycast (`raycast = () => {}`).
- **Konsol.** Satu-satunya log yang sengaja ditambahkan adalah `console.log` hierarchy GLB saat model termuat.
  Cek tab Console browser (F12) sebelum mengumpulkan untuk memastikan tidak ada error.
