/**
 * 3D Model Viewer using Three.js
 * Loads .glb files with orbit controls, auto-rotation, and lighting.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function initModelViewer(containerId, modelPath) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Check if model path is provided
    if (!modelPath) {
        container.innerHTML = `
            <div class="model-placeholder">
                <i class="fas fa-cube"></i>
                <p>3D Model Placeholder</p>
                <p style="font-size: 0.8rem; opacity: 0.6;">Drop a .glb file here</p>
            </div>
        `;
        return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12121a);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1, 3);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x00d4ff, 0.3);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Grid helper
    const grid = new THREE.GridHelper(10, 20, 0x1a1a2e, 0x1a1a2e);
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scene.add(grid);

    // Load model
    const loader = new GLTFLoader();
    loader.load(
        modelPath,
        (gltf) => {
            const model = gltf.scene;
            // Center and scale model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            scene.add(model);

            // Adjust camera
            camera.position.set(0, size.y * scale * 0.5, maxDim * scale * 2.5);
            controls.target.set(0, size.y * scale * 0.3, 0);
            controls.update();
        },
        (xhr) => {
            // Loading progress - could add a progress bar
        },
        (error) => {
            console.error('Error loading model:', error);
            container.innerHTML = `
                <div class="model-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading 3D model</p>
                </div>
            `;
        }
    );

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // Control buttons
    const controlsDiv = container.querySelector('.model-controls');
    if (controlsDiv) {
        controlsDiv.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
            controls.reset();
        });
        controlsDiv.querySelector('[data-action="rotate"]')?.addEventListener('click', () => {
            controls.autoRotate = !controls.autoRotate;
        });
    }
}
