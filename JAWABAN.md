# Jawaban Praktikum Pertemuan 7 — Three.js Interactive 3D Application

**1. Apa itu Scene Graph?**
Struktur pohon yang mengatur semua objek dalam scene. Setiap node (Object3D) bisa punya parent dan children, dan akar pohonnya adalah `Scene`.

**2. Mengapa Scene Graph menggunakan hierarchy?**
Karena banyak benda nyata tersusun dari bagian-bagian yang bergerak bersama. Dengan hierarchy, bagian cukup diatur relatif terhadap induknya, bukan dihitung satu per satu terhadap dunia.

**3. Apa arti parent pada Object3D?**
Parent adalah node di atasnya yang menjadi acuan transformasi. Posisi, rotasi, dan skala parent diwariskan ke semua anaknya.

**4. Apa arti children?**
Daftar Object3D yang menempel pada suatu node (`object.children`). Mereka ikut bergerak, berputar, dan berskala mengikuti node tersebut.

**5. Apa yang terjadi ketika parent bergerak?**
Semua descendant ikut bergerak. Local transform child tidak berubah, tetapi world transform-nya ikut berubah.

**6. Apa itu local transform?**
Posisi, rotasi, dan skala sebuah object relatif terhadap parent-nya (`object.position`, `.rotation`, `.scale`).

**7. Apa itu world transform?**
Transformasi object di ruang dunia (scene), yaitu hasil gabungan seluruh transformasi dari root sampai object itu. Bisa dibaca lewat `getWorldPosition()` atau `matrixWorld`.

**8. Mengapa local position child tidak selalu sama dengan world position?**
Local position diukur dari parent, sedangkan world position diukur dari origin scene. Keduanya sama hanya bila parent berada di origin tanpa rotasi dan skala (identity).

**9. Bagaimana hubungan parent matrix dan child matrix?**
`child.matrixWorld = parent.matrixWorld × child.matrix`. Matriks lokal child dikalikan dengan matriks world parent, dan ini berlangsung berantai dari root.

**10. Apa fungsi THREE.Group?**
Wadah (Object3D kosong) untuk mengelompokkan beberapa object agar bisa dipindah, diputar, atau diskalakan sekaligus.

**11. Apakah Group harus mempunyai geometry?**
Tidak. Group tidak punya geometry atau material, tidak dirender sendiri, dan hanya berfungsi sebagai node pengorganisasi.

**12. Apa itu PBR?**
Physically Based Rendering: pendekatan shading yang memodelkan interaksi cahaya dan permukaan secara fisik, dengan parameter seperti warna dasar, roughness, dan metalness, sehingga material tampak konsisten di berbagai kondisi cahaya.

**13. Apa fungsi MeshStandardMaterial?**
Material PBR standar di Three.js. Ia memakai `color`, `roughness`, `metalness` (dan opsional texture, emissive) dan bereaksi terhadap cahaya serta environment map.

**14. Apa arti roughness = 0?**
Permukaan sangat halus seperti cermin: pantulan tajam dan highlight kecil serta terang.

**15. Apa arti roughness = 1?**
Permukaan sangat kasar: cahaya dipantulkan menyebar sehingga pantulan buram dan highlight lebar serta redup.

**16. Apa arti metalness = 0?**
Material non-logam (dielektrik) seperti plastik, kayu, atau batu. Warna dasar tampil sebagai warna diffuse dan pantulannya lemah.

**17. Apa arti metalness = 1?**
Material logam murni. Hampir tidak ada diffuse; tampilan didominasi pantulan lingkungan yang diwarnai oleh warna dasar.

**18. Mengapa PBR membutuhkan lighting/environment yang baik?**
Karena tampilan PBR berasal dari cahaya yang dipantulkan. Tanpa cahaya atau environment yang kaya, terutama pada logam, hasilnya gelap dan datar karena tidak ada yang bisa dipantulkan.

**19. Apa itu GLTF?**
Format standar terbuka untuk aset 3D (sering disebut "JPEG-nya 3D"), yang menyimpan mesh, material, texture, hierarchy, dan animasi.

**20. Apa itu GLB?**
Versi biner GLTF yang membungkus semua data (JSON, buffer, bahkan texture) ke dalam satu file `.glb`.

**21. Apa perbedaan praktis GLTF dan GLB?**
GLTF biasanya terdiri dari beberapa file (`.gltf` + `.bin` + gambar) sehingga mudah diinspeksi tetapi rawan path rusak. GLB satu file, lebih mudah didistribusikan dan dimuat.

**22. Data apa saja yang dapat dibawa GLTF?**
Mesh/geometry, material PBR, texture, hierarchy node, skin/skeleton, animation clip, kamera, dan cahaya (lewat ekstensi).

**23. Apa fungsi GLTFLoader?**
Memuat dan mem-parse file GLTF/GLB lalu mengubahnya menjadi objek Three.js (`Scene`, `Mesh`, `Material`, `AnimationClip`, dst.).

**24. Mengapa loading GLB asynchronous?**
Karena file harus diunduh lewat jaringan lalu di-parse, yang butuh waktu. Jika sinkron, halaman akan membeku selama proses itu. Hasilnya diterima lewat callback atau Promise.

**25. Apa yang biasanya terdapat pada gltf.scene?**
Sebuah `Group`/`Scene` yang berisi hierarchy node hasil import: `Object3D`, `Mesh` (dengan geometry dan material), serta kadang `Bone` atau `SkinnedMesh`.

**26. Apa fungsi traverse()?**
Menelusuri sebuah object beserta seluruh descendant-nya secara rekursif dan menjalankan callback pada tiap node. Berguna untuk mengaktifkan shadow, mengganti material, atau mencetak hierarchy.

**27. Apa yang terdapat pada gltf.animations?**
Array `AnimationClip` (setiap clip berisi keyframe track) yang disertakan di file model, misalnya Idle, Walk, Run.

**28. Apa fungsi AnimationMixer?**
Pemutar animasi untuk satu object (dan descendant-nya). Ia mengelola banyak `AnimationAction`, mengatur waktu, blending, dan cross-fade.

**29. Apa fungsi clipAction()?**
Membuat (atau mengambil) `AnimationAction` dari sebuah clip untuk mixer, sehingga clip itu dapat dijalankan dan dikendalikan (`play`, `stop`, `fadeIn`, `setLoop`).

**30. Mengapa mixer.update(delta) diperlukan?**
Mixer tidak berjalan sendiri. `update(delta)` memajukan waktu animasi sebesar delta tiap frame dan menerapkan hasilnya ke object. Tanpanya pose tidak pernah berubah.

**31. Apa itu raycasting?**
Teknik menembakkan garis (ray) ke dalam scene 3D lalu mencari object pertama yang ditabraknya.

**32. Mengapa raycasting diperlukan untuk interaction 3D?**
Pointer berada di ruang layar 2D, sedangkan object berada di ruang 3D. Raycasting menjembatani keduanya agar kita tahu object mana yang ada di bawah pointer.

**33. Apa itu NDC?**
Normalized Device Coordinates: sistem koordinat ternormalisasi layar/canvas, yaitu pusat di (0,0) dan tepi kiri-kanan serta bawah-atas di −1 dan +1.

**34. Berapa rentang coordinate NDC?**
−1 sampai +1 pada sumbu x dan y. (Untuk pointer: x = −1 di kiri, +1 di kanan; y = +1 di atas, −1 di bawah.)

**35. Apa fungsi raycaster.setFromCamera()?**
Mengatur origin dan arah ray dari posisi kamera menembus titik NDC pointer, sesuai proyeksi kamera.

**36. Apa fungsi intersectObjects()?**
Menguji ray terhadap daftar object dan mengembalikan array hasil tabrakan, diurutkan dari yang terdekat ke kamera.

**37. Mengapa recursive intersection berguna pada GLB?**
GLB berupa hierarchy dengan banyak mesh di dalam anak-anaknya. Dengan `recursive = true`, mesh-mesh turunan ikut diuji, bukan hanya root-nya (yang biasanya bukan Mesh).

**38. Apa perbedaan hover dan click?**
Hover terjadi saat pointer berada di atas object dan bersifat sementara. Click adalah aksi eksplisit yang mengubah state secara bertahan (selection).

**39. Mengapa selection membutuhkan state?**
Agar aplikasi mengingat object terpilih setelah pointer pindah. Tanpa state, pilihan hilang dan tidak bisa dipakai untuk panel info, highlight, atau aksi lanjutan.

**40. Apa fungsi visual feedback?**
Memberi tahu pengguna bahwa object bisa dipilih (hover) atau sedang dipilih (selected), misalnya lewat glow, skala, atau cursor, sehingga interaksi terasa jelas dan responsif.

**41. Apa itu environment map?**
Texture yang merepresentasikan sekeliling scene (cubemap/equirectangular/PMREM) dan dipakai sebagai sumber cahaya serta pantulan oleh material PBR.

**42. Apa fungsi scene.background?**
Menentukan apa yang tampil sebagai latar di belakang objek (warna, texture, atau cubemap). Ia hanya memengaruhi tampilan latar, bukan pencahayaan objek.

**43. Apa fungsi scene.environment?**
Menyediakan environment map untuk pencahayaan dan pantulan semua material PBR di scene, tanpa harus ditampilkan sebagai latar.

**44. Mengapa material metal sangat terbantu oleh environment?**
Logam hampir tidak punya diffuse, tampilannya hampir seluruhnya pantulan. Tanpa environment tidak ada yang dipantulkan sehingga tampak hitam, dengan environment ia menampilkan pantulan yang membentuk karakter logam.

**45. Bagaimana semua komponen tersebut membentuk interactive 3D application?**
Scene Graph mengorganisasi objek, PBR + environment menentukan tampilan, GLB membawa aset kompleks, AnimationMixer memberi gerak, Raycaster menghubungkan pointer dengan objek 3D, state (hover/selected) menyimpan kondisi interaksi, dan visual feedback + HUD menyampaikannya ke pengguna, semuanya digerakkan oleh animation loop.

## 112. Pertanyaan Analisis

**A — Hierarchy.** Tidak. Wheel adalah child dari car, jadi local position wheel adalah posisi relatif terhadap car dan tetap sama (misalnya 1 unit di sisi car). Ketika car bergerak 10 unit, matriks world car berubah, sehingga world position wheel ikut bergeser 10 unit secara otomatis.

**B — Scene Graph.** Dengan hierarchy, cukup satu node (mis. `robot`) yang dipindah atau diputar dan semua bagian ikut. Tiap bagian hanya mengurus gerak lokalnya (mis. lengan terhadap badan). Jika semua part menjadi child langsung Scene, tiap bagian harus diupdate manual dan dihitung posisi dunianya sendiri, sehingga rumit, rawan salah, dan sulit dianimasikan.

**C — PBR.** Warna hanyalah satu parameter. Roughness mengatur seberapa tajam atau buram pantulan, dan metalness mengatur apakah cahaya dipantulkan seperti logam atau tersebar seperti non-logam. Dua sphere berwarna sama dapat tampak berbeda: yang metalness tinggi dan roughness rendah tampil seperti cermin berwarna, sedangkan yang metalness rendah dan roughness tinggi tampil buram seperti plastik/kapur.

**D — Asset.** GLB umumnya berupa hierarchy dengan banyak node, mesh, dan kadang tulang. `gltf.scene` sendiri biasanya `Group` yang bukan Mesh. Jika diasumsikan satu Mesh, kode untuk shadow, raycast, atau material hanya mengenai sebagian bagian (atau gagal). Karena itu perlu `traverse()` dan raycast recursive.

**E — Animation.** `action.play()` hanya menandai action aktif. Yang memajukan waktu clip dan menulis hasil interpolasi ke transform object adalah `mixer.update(delta)`. Jika tidak dipanggil tiap frame di animation loop, waktu animasi tidak maju dan model diam.

**F — Raycasting.** Raycaster bekerja di ruang normalisasi (NDC −1…+1) yang diproyeksikan melalui kamera, sedangkan koordinat mouse berupa piksel dengan origin di kiri atas dan sumbu y ke bawah. Piksel harus dikonversi ke NDC (`x = px/width·2 − 1`, `y = −(py/height)·2 + 1`) agar ray sesuai dengan tampilan, apapun ukuran canvas-nya.

**G — Interaction State.** Keduanya punya siklus hidup berbeda. `hoveredObject` berubah terus mengikuti pointer, sedangkan `selectedObject` hanya berubah saat klik. Jika digabung, selection hilang tiap pointer berpindah, dan tidak bisa menampilkan hover pada satu objek sambil objek lain tetap terpilih.

**H — Environment.** `background` mengatur apa yang terlihat di belakang scene, `environment` mengatur cahaya dan pantulan pada material. Keduanya bisa dibutuhkan secara terpisah: misalnya background polos gelap tetapi objek tetap mendapat pencahayaan environment yang terang, atau background panorama tanpa mengubah lighting. Memisahkannya memberi kontrol independen.

## 116. Refleksi Praktikum

Scene Graph membuat objek yang saling berhubungan mudah dikelola karena cukup memindahkan satu parent agar semua child ikut bergerak. Local transform adalah posisi relatif terhadap parent, sedangkan world transform adalah posisi akhir di scene; pada demo, local child tetap tetapi world-nya berubah ketika parent berputar. Roughness mengatur ketajaman pantulan dan metalness mengatur karakter logam, dan galeri sphere membuktikan bahwa dua material berwarna sama bisa terlihat sangat berbeda. Memuat GLB ternyata asynchronous dan berbentuk hierarchy, sehingga logika shadow, mixer, dan selection harus ditempatkan di dalam callback dan memakai `traverse()`. AnimationMixer memutar animation clip dan mengelola beberapa action sekaligus (Idle, Walk, Run, Wave) dengan cross-fade, selama `mixer.update(delta)` dipanggil tiap frame. Pointer berupa piksel layar dikonversi ke NDC, lalu `setFromCamera` membentuk ray, dan `intersectObjects` secara recursive menemukan mesh yang kemudian dipetakan ke selectable root. Hover bersifat sementara mengikuti pointer, sedangkan click menyimpan selection dalam state yang bertahan walau pointer berpindah. Environment map memberi sesuatu untuk dipantulkan sehingga material PBR, terutama logam, tampak hidup, dan hal ini terlihat jelas ketika tombol E mematikannya.
