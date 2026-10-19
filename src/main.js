import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import "./style.css";

/* ==========================================================================
   1. DOM / HUD reference
   ========================================================================== */
const $ = (id) => document.getElementById(id);

const app = $("app");
const hoverInfo = $("hoverInfo");
const selectedInfo = $("selectedInfo");
const animationInfo = $("animationInfo");
const loadingInfo = $("loadingInfo");
const envInfo = $("envInfo");
const childLocalInfo = $("childLocalInfo");
const childWorldInfo = $("childWorldInfo");
const infoName = $("infoName");
const infoPosition = $("infoPosition");
const infoRotation = $("infoRotation");
const infoScale = $("infoScale");
const infoMaterial = $("infoMaterial");

/** set textContent hanya jika berubah (hindari kerja DOM tiap frame) */
function setText(el, value) {
  if (el.textContent !== value) el.textContent = value;
}

const fmt = (v) => `${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`;
const fmtDeg = (e) =>
  [e.x, e.y, e.z].map((r) => THREE.MathUtils.radToDeg(r).toFixed(1)).join(", ");

/* ==========================================================================
   2. Scene, camera, renderer
   ========================================================================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);

const sizes = { width: window.innerWidth, height: window.innerHeight };

const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 100);
camera.position.set(6, 4.2, 10.5);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

/* OrbitControls + batas navigasi (modul 39.1) */
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-0.5, 1.4, -0.5);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 25;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.update();

/* ==========================================================================
   3. Lighting + shadow
   ========================================================================== */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
directionalLight.position.set(5, 9, 6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.camera.left = -12;
directionalLight.shadow.camera.right = 12;
directionalLight.shadow.camera.top = 12;
directionalLight.shadow.camera.bottom = -12;
directionalLight.shadow.bias = -0.0005;
directionalLight.shadow.normalBias = 0.02;
scene.add(directionalLight);

/* ==========================================================================
   4. Environment map (scene.environment berbeda dari scene.background)
   ========================================================================== */
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const roomEnvironment = new RoomEnvironment();
const environmentTexture = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
roomEnvironment.dispose?.();
pmremGenerator.dispose();

let environmentOn = true;
scene.environment = environmentTexture; // background tetap warna solid

function setEnvironment(on) {
  environmentOn = on;
  scene.environment = on ? environmentTexture : null;
  setText(envInfo, on ? "ON" : "OFF");
}

/* ==========================================================================
   5. Ground
   ========================================================================== */
const groundGeometry = new THREE.PlaneGeometry(20, 20);
groundGeometry.rotateX(-Math.PI / 2);

const ground = new THREE.Mesh(
  groundGeometry,
  new THREE.MeshStandardMaterial({ color: 0x263449, roughness: 0.85, metalness: 0.0 })
);
ground.name = "Ground";
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(20, 20, 0x3b4b66, 0x1f2b40);
grid.position.y = 0.002;
grid.material.transparent = true;
grid.material.opacity = 0.5;
scene.add(grid);

/* ==========================================================================
   6. Selectable registry
   --------------------------------------------------------------------------
   interactiveObjects : daftar yang di-raycast (tidak semua object)
   selectables        : root yang dapat dipilih (untuk visual feedback)
   ========================================================================== */
const interactiveObjects = [];
const selectables = [];

/**
 * Tandai object sebagai selectable root.
 * Harus dipanggil SETELAH scale awal object ditentukan (baseScale disimpan di sini).
 */
function registerSelectable(object, label, { noScale = false } = {}) {
  object.userData.selectable = true;
  object.userData.label = label;
  object.userData.noScale = noScale;
  object.userData.baseScale = object.scale.clone();
  object.userData.targetScale = object.scale.clone();
  object.userData.visualState = "none";
  interactiveObjects.push(object);
  selectables.push(object);
}

/* ==========================================================================
   7. Hierarchy demo (THREE.Group + parent-child + local vs world)
   --------------------------------------------------------------------------
   Hierarchy Demo (Group)
   └── Parent Box
       ├── AxesHelper
       └── Child Sphere        <- local position TETAP, world position berubah
   ========================================================================== */
const hierarchyGroup = new THREE.Group();
hierarchyGroup.name = "Hierarchy Demo";
hierarchyGroup.position.set(-4.5, 0, 1.5);
scene.add(hierarchyGroup);

const parentMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.2, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.35, metalness: 0.2 })
);
parentMesh.name = "Parent Box";
parentMesh.position.set(0, 0.6, 0);
parentMesh.castShadow = true;
parentMesh.receiveShadow = true;
hierarchyGroup.add(parentMesh);

const parentAxes = new THREE.AxesHelper(1.2);
parentAxes.raycast = () => {}; // helper tidak ikut raycast
parentMesh.add(parentAxes);

const childMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 32, 16),
  new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4, metalness: 0.1 })
);
childMesh.name = "Child Sphere";
childMesh.position.set(1.4, 0.2, 0); // LOCAL position (relatif terhadap parent)
childMesh.castShadow = true;
childMesh.receiveShadow = true;
parentMesh.add(childMesh);

registerSelectable(parentMesh, "Parent Box");
registerSelectable(childMesh, "Child Sphere");

let parentMotionOn = true; // tombol P
let groupSwayOn = false; // tombol G
let motionTime = 0;
let swayTime = 0;

const worldPos = new THREE.Vector3();

function updateHierarchyDemo(delta) {
  if (parentMotionOn) {
    motionTime += delta;
    parentMesh.rotation.y += 0.5 * delta;
    parentMesh.position.x = Math.sin(motionTime * 0.9) * 0.9;
  }
  if (groupSwayOn) {
    swayTime += delta;
    hierarchyGroup.position.z = 1.5 + Math.sin(swayTime * 1.2) * 1.5;
  }

  // local tidak berubah, world berubah
  childMesh.getWorldPosition(worldPos);
  setText(childLocalInfo, fmt(childMesh.position));
  setText(childWorldInfo, fmt(worldPos));
}

/* ==========================================================================
   8. PBR gallery (Challenge E): roughness -> , metalness ↓
   ========================================================================== */
const galleryGroup = new THREE.Group();
galleryGroup.name = "PBR Gallery";
galleryGroup.position.set(0, 0, -5);
scene.add(galleryGroup);

const roughnessValues = [0.1, 0.5, 0.9];
const metalnessValues = [0, 0.5, 1];
const sphereGeometry = new THREE.SphereGeometry(0.5, 48, 24);

metalnessValues.forEach((metalness, row) => {
  roughnessValues.forEach((roughness, col) => {
    const sphere = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness, metalness })
    );
    sphere.name = `PBR r${roughness} m${metalness}`;
    sphere.position.set((col - 1) * 1.3, 3.05 - row * 1.25, 0);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    galleryGroup.add(sphere);
    registerSelectable(sphere, `PBR Sphere (roughness ${roughness}, metalness ${metalness})`);
  });
});

/* ==========================================================================
   9. Hierarchical Solar System (Challenge D)
   --------------------------------------------------------------------------
   Sun
   └── Earth Orbit
       └── Earth
           └── Moon Orbit
               └── Moon
   Tidak ada world position yang dihitung manual: cukup memutar node orbit.
   ========================================================================== */
const solarGroup = new THREE.Group();
solarGroup.name = "Solar System";
solarGroup.position.set(-5.5, 3.4, -3.5);
scene.add(solarGroup);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.6, 32, 16),
  new THREE.MeshStandardMaterial({
    color: 0xffc233,
    emissive: 0xff8a00,
    emissiveIntensity: 0.9,
    roughness: 0.6,
    metalness: 0,
  })
);
sun.name = "Sun";
solarGroup.add(sun);

const earthOrbit = new THREE.Object3D();
earthOrbit.name = "Earth Orbit";
sun.add(earthOrbit);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.22, 32, 16),
  new THREE.MeshStandardMaterial({ color: 0x2f7fe0, roughness: 0.6, metalness: 0 })
);
earth.name = "Earth";
earth.position.set(2.0, 0, 0);
earth.castShadow = true;
earthOrbit.add(earth);

const moonOrbit = new THREE.Object3D();
moonOrbit.name = "Moon Orbit";
earth.add(moonOrbit);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 24, 12),
  new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9, metalness: 0 })
);
moon.name = "Moon";
moon.position.set(0.5, 0, 0);
moon.castShadow = true;
moonOrbit.add(moon);

// noScale: skala parent akan ikut mengubah jarak orbit anak-anaknya
registerSelectable(sun, "Sun", { noScale: true });
registerSelectable(earth, "Earth", { noScale: true });
registerSelectable(moon, "Moon", { noScale: true });

function updateSolarSystem(delta) {
  sun.rotation.y += 0.2 * delta;
  earthOrbit.rotation.y += 0.5 * delta;
  moonOrbit.rotation.y += 2.0 * delta;
}

/* ==========================================================================
   10. GLB loading + AnimationMixer (Challenge A & B)
   ========================================================================== */
const loader = new GLTFLoader();

let importedModel = null;
let mixer = null;
let activeAction = null;
let activeName = "-";
let baseName = "Idle"; // clip dasar (Idle/Walk/Run)
let isWaving = false;
const actions = {};

function updateAnimationHud() {
  if (!mixer) {
    setText(animationInfo, "-");
    return;
  }
  setText(
    animationInfo,
    isWaving ? `${activeName} (lalu kembali ke ${baseName})` : activeName
  );
}

/** Pindah animasi dengan cross-fade: action lama fade out, baru fade in */
function fadeToAction(name, duration = 0.35) {
  const next = actions[name];
  if (!next || next === activeAction) return;

  const previous = activeAction;

  next.reset();
  next.setEffectiveTimeScale(1);
  next.setEffectiveWeight(1);
  next.fadeIn(duration);
  next.play();

  if (previous) previous.fadeOut(duration);

  activeAction = next;
  activeName = name;
  updateAnimationHud();
}

/** Tombol 1/2/3 */
function setBaseAnimation(name) {
  if (!actions[name]) return;
  baseName = name;
  isWaving = false;
  fadeToAction(name);
  updateAnimationHud();
}

/** Click pada model -> jalankan Wave satu kali */
function playWave() {
  if (!actions.Wave || isWaving) return;
  isWaving = true;
  fadeToAction("Wave", 0.2);
}

loadingInfo.textContent = "loading model...";

loader.load(
  `${import.meta.env.BASE_URL}models/model.glb`, // aman untuk GitHub Pages (subpath)

  (gltf) => {
    importedModel = gltf.scene;
    importedModel.name = "Imported GLB";
    importedModel.position.set(2.6, 0, 1.2);
    importedModel.rotation.y = -0.4;
    importedModel.scale.setScalar(1.3);

    // traverse: model GLB adalah hierarchy, bukan satu mesh
    const lines = [];
    let meshCount = 0;
    importedModel.traverse((object) => {
      let depth = 0;
      for (let p = object; p !== importedModel; p = p.parent) depth++;
      lines.push(`${"  ".repeat(depth)}${object.name || "(unnamed)"} [${object.type}]`);

      if (object.isMesh) {
        meshCount++;
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    console.log(`GLB hierarchy (${meshCount} mesh):\n${lines.join("\n")}`);

    scene.add(importedModel);
    registerSelectable(importedModel, "Robot (Imported GLB)");

    // animation
    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(importedModel);

      gltf.animations.forEach((clip) => {
        actions[clip.name] = mixer.clipAction(clip);
      });

      if (actions.Wave) {
        actions.Wave.setLoop(THREE.LoopOnce, 1);
        actions.Wave.clampWhenFinished = true;
      }

      // setelah Wave selesai -> kembali ke clip dasar
      mixer.addEventListener("finished", (event) => {
        if (event.action === actions.Wave && isWaving) {
          isWaving = false;
          fadeToAction(baseName, 0.35);
        }
      });

      baseName = actions.Idle ? "Idle" : gltf.animations[0].name;
      fadeToAction(baseName, 0.01);
    }

    loadingInfo.textContent =
      `model loaded (${meshCount} mesh, ${gltf.animations.length} clip)`;
  },

  (progress) => {
    if (progress.total > 0) {
      const percent = (progress.loaded / progress.total) * 100;
      loadingInfo.textContent = `${percent.toFixed(0)}%`;
    }
  },

  (error) => {
    console.error("GLTF loading error:", error);
    loadingInfo.textContent = "load failed";
  }
);

/* ==========================================================================
   11. Raycasting: pointer -> NDC -> ray -> intersection
   ========================================================================== */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerInside = false;

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

/** child mesh GLB -> cari ancestor yang ditandai selectable */
function findSelectableRoot(object) {
  let current = object;
  while (current) {
    if (current.userData.selectable) return current;
    current = current.parent;
  }
  return null;
}

/** return { root, hit } object pertama yang terkena ray, atau null */
function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactiveObjects, true); // recursive
  for (const hit of hits) {
    const root = findSelectableRoot(hit.object);
    if (root) return { root, hit: hit.object };
  }
  return null;
}

/* ==========================================================================
   12. State: hover (sementara) vs selected (bertahan)
   ========================================================================== */
let hoveredObject = null;
let hoveredHitName = "";
let selectedObject = null;

function describeHover() {
  if (!hoveredObject) return "-";
  const label = hoveredObject.userData.label;
  return hoveredHitName && hoveredHitName !== hoveredObject.name
    ? `${label} (mesh: ${hoveredHitName})`
    : label;
}

function setHovered(root, hitName = "") {
  if (root === hoveredObject && hitName === hoveredHitName) return;
  const changed = root !== hoveredObject;
  hoveredObject = root;
  hoveredHitName = hitName;
  setText(hoverInfo, describeHover());
  if (changed) refreshVisuals();
  renderer.domElement.style.cursor = root ? "pointer" : "default";
}

function setSelected(root) {
  selectedObject = root;
  setText(selectedInfo, root ? root.userData.label : "-");
  refreshVisuals();
}

/* ==========================================================================
   13. Visual feedback (aman untuk material yang dipakai bersama - Challenge F)
   --------------------------------------------------------------------------
   Material asli TIDAK dimodifikasi. Saat hover/selected, mesh diberi klon
   material (emissive diubah pada klon). Saat state kembali "none", material
   asli dipasang lagi. Material yang dipakai banyak mesh tidak ikut berubah.
   ========================================================================== */
const HOVER_COLOR = new THREE.Color(0x38bdf8);
const SELECT_COLOR = new THREE.Color(0xfbbf24);

/** mesh milik root (tidak masuk ke dalam selectable lain di bawahnya) */
function getOwnMeshes(root) {
  if (root.userData.ownMeshes) return root.userData.ownMeshes;
  const meshes = [];
  (function walk(object) {
    if (object !== root && object.userData.selectable) return;
    if (object.isMesh) meshes.push(object);
    object.children.forEach(walk);
  })(root);
  root.userData.ownMeshes = meshes;
  return meshes;
}

function applyMeshState(mesh, state) {
  const original = mesh.userData.originalMaterial ?? mesh.material;
  if (!("emissive" in original)) return; // material tanpa emissive: lewati

  if (state === "none") {
    if (mesh.userData.originalMaterial) mesh.material = mesh.userData.originalMaterial;
    return;
  }

  if (!mesh.userData.fxMaterial) {
    mesh.userData.originalMaterial = mesh.material; // simpan material & warna asli
    mesh.userData.fxMaterial = mesh.material.clone();
  }
  const fx = mesh.userData.fxMaterial;
  const base = mesh.userData.originalMaterial;
  const selected = state === "selected";

  const alreadyGlows = base.emissive.r + base.emissive.g + base.emissive.b > 0;
  if (alreadyGlows) {
    // pertahankan warna glow asli, hanya perkuat intensitasnya
    fx.emissive.copy(base.emissive);
    fx.emissiveIntensity = base.emissiveIntensity * (selected ? 2.2 : 1.6);
  } else {
    fx.emissive.copy(selected ? SELECT_COLOR : HOVER_COLOR);
    fx.emissiveIntensity = selected ? 0.55 : 0.45;
  }
  mesh.material = fx;
}

function refreshVisuals() {
  for (const root of selectables) {
    const state =
      root === selectedObject ? "selected" : root === hoveredObject ? "hover" : "none";

    if (state !== root.userData.visualState) {
      root.userData.visualState = state;
      getOwnMeshes(root).forEach((mesh) => applyMeshState(mesh, state));

      const factor = state === "selected" ? 1.12 : state === "hover" ? 1.08 : 1;
      root.userData.targetScale.copy(root.userData.baseScale).multiplyScalar(factor);
    }
  }
}

/** scale feedback halus (dipanggil tiap frame dengan delta time) */
function updateScaleFeedback(delta) {
  const t = 1 - Math.exp(-12 * delta);
  for (const root of selectables) {
    if (root.userData.noScale) continue;
    root.scale.lerp(root.userData.targetScale, t);
  }
}

/* ==========================================================================
   14. Information panel (Challenge C)
   ========================================================================== */
const _p = new THREE.Vector3();

function updateInfoPanel() {
  if (!selectedObject) {
    setText(infoName, "-");
    setText(infoPosition, "-");
    setText(infoRotation, "-");
    setText(infoScale, "-");
    setText(infoMaterial, "-");
    return;
  }
  const o = selectedObject;
  const meshes = getOwnMeshes(o);

  let materialText = "-";
  if (o.isMesh) {
    materialText = o.material.type;
  } else if (meshes.length > 0) {
    materialText = `${meshes[0].material.type} (${meshes.length} mesh)`;
  }

  setText(infoName, o.userData.label);
  setText(infoPosition, fmt(o.getWorldPosition(_p)));
  setText(infoRotation, fmtDeg(o.rotation));
  setText(infoScale, fmt(o.scale));
  setText(infoMaterial, materialText);
}

/* ==========================================================================
   15. Pointer events: hover, click, dan pembeda click vs drag (modul 39.1)
   ========================================================================== */
let selectionGesture = null;
let suppressSelection = false;

renderer.domElement.addEventListener("pointerdown", (event) => {
  suppressSelection = event.button !== 0 || selectionGesture !== null;
  selectionGesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
});

window.addEventListener(
  "pointermove",
  (event) => {
    if (!selectionGesture || event.pointerId !== selectionGesture.id) return;
    if (Math.hypot(event.clientX - selectionGesture.x, event.clientY - selectionGesture.y) > 5) {
      suppressSelection = true;
    }
  },
  true
);

window.addEventListener("pointerup", (event) => {
  if (event.pointerId === selectionGesture?.id) selectionGesture = null;
});

window.addEventListener("pointercancel", () => {
  selectionGesture = null;
  suppressSelection = true;
});

/* hover: simpan posisi pointer; raycast dilakukan di animation loop */
renderer.domElement.addEventListener("pointermove", (event) => {
  if (selectionGesture) return; // jangan ubah hover saat drag
  updatePointer(event);
  pointerInside = true;
});

renderer.domElement.addEventListener("pointerleave", () => {
  pointerInside = false;
  if (!selectionGesture) setHovered(null);
});

/* click: pilih object (klik di area kosong = deselect) */
renderer.domElement.addEventListener("click", (event) => {
  if (suppressSelection || event.button !== 0) return;

  updatePointer(event);
  const result = pick();
  setSelected(result ? result.root : null);

  if (result && result.root === importedModel) playWave(); // Challenge B
});

/* ==========================================================================
   16. Keyboard
   ========================================================================== */
window.addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;

  switch (event.key.toLowerCase()) {
    case "1":
      setBaseAnimation("Idle");
      break;
    case "2":
      setBaseAnimation("Walk");
      break;
    case "3":
      setBaseAnimation("Run");
      break;
    case "e":
      setEnvironment(!environmentOn);
      break;
    case "p":
      parentMotionOn = !parentMotionOn;
      break;
    case "g":
      groupSwayOn = !groupSwayOn;
      break;
  }
});

/* ==========================================================================
   17. Responsive rendering
   ========================================================================== */
function handleResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener("resize", handleResize);

/* ==========================================================================
   18. Animation loop (delta time)
   ========================================================================== */
const clock = new THREE.Clock();
const SELECTED_SPIN_SPEED = 0.9; // rad/detik (Challenge G)

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.1);

  if (mixer) mixer.update(delta);

  updateHierarchyDemo(delta);
  updateSolarSystem(delta);

  // hover: raycast satu kali per frame saat pointer di atas canvas
  if (pointerInside && !selectionGesture) {
    const result = pick();
    setHovered(result ? result.root : null, result ? result.hit.name : "");
  }

  // Challenge G: object terpilih berputar perlahan (berhenti saat deselect)
  if (selectedObject) selectedObject.rotation.y += SELECTED_SPIN_SPEED * delta;

  updateScaleFeedback(delta);
  updateInfoPanel();

  controls.update();
  renderer.render(scene, camera);
});

setEnvironment(true);
