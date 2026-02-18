import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// DOM elements
const container = document.getElementById("viewer-container");
const carSelect = document.getElementById('car-select');
const statusEl = document.getElementById('status-bar');
const loadingEl = document.getElementById('loading');
const viewTitleEl = document.getElementById('view-title');
const viewDetailsEl = document.getElementById('view-details');
const viewInfoEl = document.getElementById('view-info');

// Generic car view details (works for ALL models)
const viewDetails = {
  'cam-front': {
    title: "🏁 FRONT END",
    details: "Aggressive front fascia • LED headlights • Aerodynamic bumper • Active grille shutters"
  },
  'cam-rear': {
    title: "🚗 REAR END", 
    details: "Quad exhaust system • Diffuser • Rear spoiler • High-mount stop lamp"
  },
  'cam-side': {
    title: "⚡ SIDE PROFILE",
    details: "Sleek side lines • 20\" alloy wheels • Side air intakes • Aerodynamic mirrors"
  },
  'cam-top': {
    title: "🔝 TOP VIEW",
    details: "Wide stance • Panoramic roof • Dynamic roof rails • Shark fin antenna"
  },
  'cam-orbit': {
    title: "🔄 FULL 360°",
    details: "Premium supercar • Advanced aerodynamics • Carbon fiber accents • High-performance engineering"
  }
};

// Core setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 3, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2.2;
controls.minPolarAngle = 0.2;
controls.minDistance = 3;
controls.maxDistance = 20;

// Studio lighting
scene.add(new THREE.AmbientLight(0x404040, 0.4));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(4, 6, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xddddff, 0.8);
fillLight.position.set(-3, 4, -2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
rimLight.position.set(-1, 3, -5);
scene.add(rimLight);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Car system
const carGroup = new THREE.Group();
carGroup.position.y = 0;
scene.add(carGroup);

let currentCarModel = null;
let doorsAngle = 0;
let hoodAngle = 0;
let trunkAngle = 0;
const loader = new GLTFLoader();

// **MULTI-GLB LOADER** - Reads from your dropdown
function loadCarModel() {
  if (!carSelect) return;
  
  const modelPath = carSelect.value;
  
  if (loadingEl) {
    loadingEl.textContent = `Loading ${modelPath}...`;
    loadingEl.style.display = 'block';
  }
  if (statusEl) statusEl.textContent = `Loading ${modelPath}...`;

  // Clear existing model
  if (currentCarModel) {
    carGroup.remove(currentCarModel);
    currentCarModel = null;
  }

  loader.load(
    modelPath,
    (gltf) => {
      console.log(`✅ ${modelPath} LOADED SUCCESSFULLY!`, gltf);
      currentCarModel = gltf.scene;
      
      // Auto center & scale ANY car model
      const box = new THREE.Box3().setFromObject(currentCarModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      currentCarModel.position.sub(center);
      currentCarModel.scale.setScalar(7 / maxDim);
      
      // Fix materials & shadows for ALL models
      currentCarModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.needsUpdate = true;
            if (child.material.transparent && child.material.opacity < 0.1) {
              child.material.opacity = 0.9;
            }
          }
        }
      });
      
      carGroup.add(currentCarModel);
      
      if (loadingEl) loadingEl.style.display = 'none';
      if (statusEl && carSelect) {
        statusEl.textContent = `✅ ${carSelect.options[carSelect.selectedIndex].text} Loaded! • FPS: --`;
      }
    },
    (progress) => {
      if (loadingEl) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        loadingEl.textContent = `Loading... ${percent}%`;
      }
    },
    (error) => {
      console.error(`❌ Failed to load ${modelPath}:`, error);
      if (loadingEl) {
        loadingEl.style.display = 'none';
      }
      if (statusEl) {
        statusEl.textContent = `❌ ${modelPath} not found`;
      }
      createFallbackCar();
    }
  );
}

// Fallback car (if GLB fails)
function createFallbackCar() {
  currentCarModel = new THREE.Group();
  const bodyGeom = new THREE.BoxGeometry(3, 1.2, 6);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = 0.6;
  body.castShadow = true;
  currentCarModel.add(body);

  const cabinGeom = new THREE.BoxGeometry(2.2, 1, 2.5);
  const cabinMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const cabin = new THREE.Mesh(cabinGeom, cabinMat);
  cabin.position.set(0, 1.8, -0.5);
  cabin.castShadow = true;
  currentCarModel.add(cabin);

  const wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  [-1.2, 1.2].forEach(x => {
    [-2.2, 2.2].forEach(z => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.4, z);
      wheel.castShadow = true;
      currentCarModel.add(wheel);
    });
  });

  carGroup.add(currentCarModel);
  if (statusEl) statusEl.textContent = 'Fallback Car Loaded';
}

// Dynamic view info panel
function showViewInfo(viewId) {
  const info = viewDetails[viewId] || viewDetails['cam-front'];
  if (viewTitleEl) viewTitleEl.textContent = info.title;
  if (viewDetailsEl) viewDetailsEl.textContent = info.details;
  if (viewInfoEl) viewInfoEl.classList.add('show');
}

// Camera controls
const camPresets = {
  'cam-front': { pos: [0, 2.5, 7], target: [0, 1.5, 0] },
  'cam-rear': { pos: [0, 2.5, -7], target: [0, 1.5, 0] },
  'cam-side': { pos: [7, 2.5, 0], target: [0, 1.5, 0] },
  'cam-top': { pos: [0, 7, 1], target: [0, 2, 0] },
  'cam-orbit': null
};

// Event Listeners
if (carSelect) {
  carSelect.onchange = loadCarModel;
}

// Camera view buttons
Object.keys(camPresets).forEach(id => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.onclick = () => {
      const buttons = document.querySelectorAll('.button-group button');
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      showViewInfo(id);
      
      if (camPresets[id]) {
        const preset = camPresets[id];
        camera.position.set(...preset.pos);
        camera.lookAt(...preset.target);
        controls.target.set(...preset.target);
      } else {
        controls.reset();
      }
      controls.update();
    };
  }
});

// Animation buttons
const doorsOpenBtn = document.getElementById('doors-open');
const doorsCloseBtn = document.getElementById('doors-close');
const hoodOpenBtn = document.getElementById('hood-open');
const hoodCloseBtn = document.getElementById('hood-close');
const trunkOpenBtn = document.getElementById('trunk-open');
const trunkCloseBtn = document.getElementById('trunk-close');

if (doorsOpenBtn) doorsOpenBtn.onclick = () => doorsAngle = Math.PI / 3;
if (doorsCloseBtn) doorsCloseBtn.onclick = () => doorsAngle = 0;
if (hoodOpenBtn) hoodOpenBtn.onclick = () => hoodAngle = -Math.PI / 4;
if (hoodCloseBtn) hoodCloseBtn.onclick = () => hoodAngle = 0;
if (trunkOpenBtn) trunkOpenBtn.onclick = () => trunkAngle = Math.PI / 4;
if (trunkCloseBtn) trunkCloseBtn.onclick = () => trunkAngle = 0;

// Color picker
const colorInput = document.getElementById("color");
if (colorInput) {
  colorInput.oninput = (e) => {
    const color = new THREE.Color(e.target.value);
    if (currentCarModel) {
      currentCarModel.traverse((child) => {
        if (child.isMesh && child.material && child.material.color) {
          if (!child.name.toLowerCase().includes('glass') && 
              !child.name.toLowerCase().includes('wheel') &&
              !child.name.toLowerCase().includes('rim')) {
            child.material.color.copy(color);
          }
        }
      });
    }
  };
}

// Wheel colors
const wheelSelect = document.getElementById("wheel-select");
if (wheelSelect) {
  wheelSelect.onchange = (e) => {
    const colors = { 
      stock: 0x444444, 
      mag: 0x666666, 
      torq: 0xaaaaaa, 
      crager: 0x888888 
    };
    if (currentCarModel) {
      currentCarModel.traverse((child) => {
        if (child.isMesh && child.material && child.material.color &&
            (child.name.toLowerCase().includes('wheel') || 
             child.name.toLowerCase().includes('rim'))) {
          child.material.color.set(colors[e.target.value] || 0x444444);
        }
      });
    }
  };
}

// Environment backgrounds
const envSelect = document.getElementById("env-select");
if (envSelect) {
  envSelect.onchange = (e) => {
    const envs = { 
      studio: 0x111111, 
      garage: 0x222222, 
      sunset: 0x442211 
    };
    scene.background = new THREE.Color(envs[e.target.value] || 0x111111);
  };
}

// Engine sound toggle
const engineBtn = document.getElementById('engine-sound');
if (engineBtn) {
  let engineOn = false;
  engineBtn.onclick = () => {
    engineOn = !engineOn;
    engineBtn.textContent = engineOn ? '🔇 Engine ON' : '🔊 Engine OFF';
    engineBtn.classList.toggle('active', engineOn);
  };
}

// Animation updates
function updateAnimations() {
  if (!currentCarModel) return;
  currentCarModel.traverse((child) => {
    if (child.isMesh) {
      if (child.name.toLowerCase().includes('door')) {
        child.rotation.y = doorsAngle * (child.position.x > 0 ? 1 : -1);
      }
      if (child.name.toLowerCase().includes('hood')) {
        child.rotation.x = hoodAngle;
      }
      if (child.name.toLowerCase().includes('trunk') || child.name.toLowerCase().includes('boot')) {
        child.rotation.x = -trunkAngle;
      }
    }
  });
}

function updateButtonStates() {
  if (doorsOpenBtn) doorsOpenBtn.classList.toggle('active', doorsAngle > 0);
  if (doorsCloseBtn) doorsCloseBtn.classList.toggle('active', doorsAngle === 0);
  if (hoodOpenBtn) hoodOpenBtn.classList.toggle('active', hoodAngle < 0);
  if (hoodCloseBtn) hoodCloseBtn.classList.toggle('active', hoodAngle === 0);
  if (trunkOpenBtn) trunkOpenBtn.classList.toggle('active', trunkAngle > 0);
  if (trunkCloseBtn) trunkCloseBtn.classList.toggle('active', trunkAngle === 0);
}

// Window resize
window.onresize = () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
};

// Main render loop
const clock = new THREE.Clock();
let fps = 0;
let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  frameCount++;
  
  carGroup.rotation.y += 0.003;
  updateAnimations();
  updateButtonStates();
  controls.update();
  
  if (frameCount % 60 === 0) fps = Math.round(1 / delta);
  
  if (statusEl && carSelect) {
    const modelName = carSelect.options[carSelect.selectedIndex].text;
    statusEl.textContent = `FPS: ${fps} • Model: ${modelName}`;
  }
  
  renderer.render(scene, camera);
}

// START - Load first car model
loadCarModel();
const frontBtn = document.getElementById('cam-front');
if (frontBtn) frontBtn.click();
showViewInfo('cam-front');
animate();
