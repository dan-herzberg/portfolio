import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('model-viewer');
const fileInput = document.getElementById('model-file');
const toggleRotateBtn = document.getElementById('toggle-rotate');
const resetViewBtn = document.getElementById('reset-view');

let scene, camera, renderer, controls, currentModel;

function initScene() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12121a);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1, 3);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x00d4ff, 0.3);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(10, 20, 0x1a1a2e, 0x1a1a2e);
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scene.add(grid);

    window.addEventListener('resize', onResize);

    animate();
}

function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function frameModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2 / maxDim;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    scene.add(model);

    camera.position.set(0, size.y * scale * 0.5, maxDim * scale * 2.5);
    controls.target.set(0, size.y * scale * 0.3, 0);
    controls.update();
}

function clearModel() {
    if (currentModel) {
        scene.remove(currentModel);
        currentModel = null;
    }
}

function showPlaceholder(message, isError) {
    container.innerHTML = `
        <div class="model-placeholder">
            <i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-cube'}"></i>
            <p>${message}</p>
        </div>
    `;
}

function ensureCanvas() {
    if (!renderer) {
        container.innerHTML = '';
        initScene();
        container.appendChild(renderer.domElement);
    } else if (!container.contains(renderer.domElement)) {
        container.innerHTML = '';
        container.appendChild(renderer.domElement);
        onResize();
    }
}

function loadFromUrl(url) {
    ensureCanvas();
    const loader = new GLTFLoader();
    loader.load(
        url,
        (gltf) => {
            clearModel();
            currentModel = gltf.scene;
            frameModel(currentModel);
        },
        undefined,
        () => showPlaceholder('Error loading 3D model', true)
    );
}

function loadFromFile(file) {
    ensureCanvas();
    const reader = new FileReader();
    reader.onload = (event) => {
        const loader = new GLTFLoader();
        loader.parse(
            event.target.result,
            '',
            (gltf) => {
                clearModel();
                currentModel = gltf.scene;
                frameModel(currentModel);
            },
            () => showPlaceholder('Error loading 3D model', true)
        );
    };
    reader.readAsArrayBuffer(file);
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) loadFromFile(file);
});

container.addEventListener('dragover', (e) => {
    e.preventDefault();
});

container.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadFromFile(file);
});

toggleRotateBtn.addEventListener('click', () => {
    if (controls) controls.autoRotate = !controls.autoRotate;
});

resetViewBtn.addEventListener('click', () => {
    if (controls) controls.reset();
});

const params = new URLSearchParams(window.location.search);
const modelParam = params.get('model');
if (modelParam) {
    loadFromUrl(modelParam);
}
