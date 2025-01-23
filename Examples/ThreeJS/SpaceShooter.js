// Import necessary modules
import * as THREE from 'three';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';
import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import {
    EffectComposer
} from 'three/addons/postprocessing/EffectComposer.js';
import {
    RenderPass
} from 'three/addons/postprocessing/RenderPass.js';
import {
    UnrealBloomPass
} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
    SMAAPass
} from 'three/addons/postprocessing/SMAAPass.js';

// Initialize loading manager
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);
let assetsLoaded = false;
// Initialize loading counter
let totalAssets = 0;
let loadedAssets = 0;

// Optionally, add URL remapping if needed
// Initialize scene setup

const parentDiv = document.getElementById('renderDiv');
let canvas = document.getElementById('threeRenderCanvas');
if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'threeRenderCanvas';
    parentDiv.appendChild(canvas);
}

// Create loading screen
const loadingScreen = document.createElement('div');
loadingScreen.style.position = 'absolute';
loadingScreen.style.top = '0';
loadingScreen.style.left = '0';
loadingScreen.style.width = '100%';
loadingScreen.style.height = '100%';
loadingScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
loadingScreen.style.color = 'white';
loadingScreen.style.display = 'flex';
loadingScreen.style.justifyContent = 'center';
loadingScreen.style.alignItems = 'center';
loadingScreen.style.fontSize = '24px';
loadingScreen.innerHTML = 'Loading... 0%';
parentDiv.appendChild(loadingScreen);

// Loading manager events
loadingManager.onStart = function() {
    console.log('Loading started');
};
loadingManager.onProgress = function(url, loaded, total) {
    if (total > 0) {
        const progress = (loaded / total * 100).toFixed(0);
        loadingScreen.innerHTML = `Loading... ${progress}%`;
        console.log('Loading progress:', progress + '%');
    }
};
loadingManager.onLoad = function() {
    console.log('Loading completed');
    assetsLoaded = true;
    loadingScreen.style.display = 'none';
};
loadingManager.onError = function(url) {
    console.error('Error loading:', url);
    // Still mark as loaded to prevent hanging
    assetsLoaded = true;
    loadingScreen.style.display = 'none';
};

// Initialize the scene
const scene = new THREE.Scene();

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

const clock = new THREE.Clock();

// Initialize the camera
const camera = new THREE.PerspectiveCamera(
    75,
    canvas.offsetWidth / canvas.offsetHeight,
    0.1,
    1000
);
// Adjusted camera position
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

// Camera settings for character following
const playerSettings = {
    rotationSpeed: 0.002, // Mouse sensitivity
    moveSpeed: 30, // Movement speed
    minPitch: -Math.PI / 3, // Look up limit
    maxPitch: Math.PI / 3, // Look down limit
    damping: 0.1, // Movement damping
};

// Initialize the renderer with HDR
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas,
    powerPreference: 'high-performance',
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Initialize post-processing
const composer = new EffectComposer(renderer);

// Regular scene render pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add subtle bloom effect
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.2, // bloom strength
    0.4, // radius
    0.9 // threshold
);
composer.addPass(bloomPass);

// Add anti-aliasing
const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
);
composer.addPass(smaaPass);

// Initialize composer size
composer.setSize(parentDiv.clientWidth, parentDiv.clientHeight);

// Define sky colors for environmental lighting
// Create background stars and dynamic starfield
function createBackgroundStars() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    // Reduced number of background stars
    const numStars = 1000; // Halved from 2000
    const radius = 800;
    const sizes = [];
    const colors = [];

    // Star color variations
    const starColors = [
        new THREE.Color(0xFFFFFF), // White
        new THREE.Color(0xFFF4E8), // Warm white
        new THREE.Color(0xE8F4FF), // Cool white
        new THREE.Color(0xFFE8E8), // Slightly red
        new THREE.Color(0xE8FFED) // Slightly green
    ];
    for (let i = 0; i < numStars; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        vertices.push(x, y, z);

        // Random size between 1 and 4
        sizes.push(randomBetween(1, 4));

        // Random color from starColors array
        const color = starColors[Math.floor(Math.random() * starColors.length)];
        colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
        size: 1,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.8,
        vertexColors: true, // Enable vertex colors
    });

    const backgroundStars = new THREE.Points(geometry, material);
    backgroundStars.name = 'backgroundStars';
    scene.add(backgroundStars);
}
// Dynamic star system for close stars
const starSystem = {
    stars: [],
    spawnDistance: 300,
    despawnDistance: 500,
    spawnCount: 25, // Reduced from 50 to 25
    lastSpawnPosition: new THREE.Vector3(),
    spawnInterval: 20, // Distance to travel before spawning new stars
};

function createStar(position) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    // Random offset within spawn area
    const offset = new THREE.Vector3(
        (Math.random() - 0.5) * starSystem.spawnDistance,
        (Math.random() - 0.5) * starSystem.spawnDistance,
        (Math.random() - 0.5) * starSystem.spawnDistance
    );

    const finalPosition = position.clone().add(offset);
    vertices.push(finalPosition.x, finalPosition.y, finalPosition.z);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.2,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6
    });

    const star = new THREE.Points(geometry, material);
    scene.add(star);

    return {
        mesh: star,
        position: finalPosition
    };
}

function createStarfield() {
    // Initial star spawn around starting position
    starSystem.lastSpawnPosition.copy(camera.position);

    for (let i = 0; i < starSystem.spawnCount; i++) {
        const star = createStar(camera.position);
        starSystem.stars.push(star);
    }

    // Set scene background to space black
    scene.background = new THREE.Color(0x000000);
}
// Create basic cockpit
function createSpaceshipCockpit() {
    const cockpitGroup = new THREE.Group();
    // Create main cockpit frame
    const frameGeometry = new THREE.BoxGeometry(6, 4, 6);
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x303030,
        metalness: 0.8,
        roughness: 0.2
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    // Create windshield
    const windshieldGeometry = new THREE.SphereGeometry(3, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const windshieldMaterial = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.3,
        metalness: 0.9,
        roughness: 0.1
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.z = 0.5;
    windshield.rotation.x = -Math.PI / 2;
    // Create dashboard
    const dashboardGeometry = new THREE.BoxGeometry(5, 1.5, 2);
    const dashboardMaterial = new THREE.MeshStandardMaterial({
        color: 0x202020,
        metalness: 0.7,
        roughness: 0.3
    });
    const dashboard = new THREE.Mesh(dashboardGeometry, dashboardMaterial);
    dashboard.position.set(0, -1, 1);
    // Create side panels
    const sidePanelGeometry = new THREE.BoxGeometry(0.5, 3, 4);
    const leftPanel = new THREE.Mesh(sidePanelGeometry, frameMaterial);
    const rightPanel = new THREE.Mesh(sidePanelGeometry, frameMaterial);
    leftPanel.position.set(-2.75, 0, 1);
    rightPanel.position.set(2.75, 0, 1);
    cockpitGroup.add(frame);
    cockpitGroup.add(windshield);
    cockpitGroup.add(dashboard);
    cockpitGroup.add(leftPanel);
    cockpitGroup.add(rightPanel);
    // Position cockpit relative to camera
    cockpitGroup.position.set(0, -1, -2);
    camera.add(cockpitGroup);
}
// Initialize space environment
createBackgroundStars(); // Add static background stars
createStarfield(); // Add dynamic foreground stars
createSpaceshipCockpit();
// Mark assets as loaded since we don't need to load any external assets
assetsLoaded = true;
loadingScreen.style.display = 'none';

// Setup first person controls
let pitch = 0;
let yaw = 0;
// Add mouse control
function onMouseMove(event) {
    if (document.pointerLockElement === canvas) {
        yaw -= event.movementX * playerSettings.rotationSpeed;
        pitch -= event.movementY * playerSettings.rotationSpeed;
        // Clamp pitch to prevent over-rotation
        pitch = Math.max(playerSettings.minPitch, Math.min(playerSettings.maxPitch, pitch));
    }
}
// Add pointer lock
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});
document.addEventListener('mousemove', onMouseMove);

// Setup improved lighting system
// Space environment lighting
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
scene.add(ambientLight);
// Add point light to simulate distant sun
const sunLight = new THREE.PointLight(0xFFFFFF, 1);
sunLight.position.set(1000, 1000, 1000);
scene.add(sunLight);
// Add subtle blue rim light to simulate space ambience
const rimLight = new THREE.DirectionalLight(0x4477FF, 0.3);
rimLight.position.set(-1, 0, -1);
scene.add(rimLight);

// =========================
// Character Integration
// =========================

// Variables for player movement
let moveDirection = new THREE.Vector3();
let velocity = new THREE.Vector3();
const keysPressed = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
};

// Add keyboard event listeners
window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        keysPressed.space = true;
    } else if (keysPressed.hasOwnProperty(event.key.toLowerCase())) {
        keysPressed[event.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
        keysPressed.space = false;
    } else if (keysPressed.hasOwnProperty(event.key.toLowerCase())) {
        keysPressed[event.key.toLowerCase()] = false;
    }
});

// Character loading removed - not needed for first person

// Update player movement
function updatePlayerMovement(deltaTime) {
    // Get camera's forward and right vectors
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    forward.applyQuaternion(camera.quaternion);
    right.applyQuaternion(camera.quaternion);

    // Calculate move direction
    moveDirection.set(0, 0, 0);
    // Add movement input
    if (keysPressed.w) moveDirection.add(forward);
    if (keysPressed.s) moveDirection.sub(forward);
    if (keysPressed.a) moveDirection.sub(right);
    if (keysPressed.d) moveDirection.add(right);
    if (keysPressed.space) moveDirection.y += 1;
    if (keysPressed.shift) moveDirection.y -= 1;

    // Normalize and apply movement
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        moveDirection.multiplyScalar(playerSettings.moveSpeed * deltaTime);

        // Update velocity
        velocity.add(moveDirection);

        // Clamp velocity
        const maxSpeed = playerSettings.moveSpeed;
        if (velocity.length() > maxSpeed) {
            velocity.normalize().multiplyScalar(maxSpeed);
        }
    }

    // Apply damping
    velocity.multiplyScalar(1 - playerSettings.damping);

    // Update camera position
    camera.position.add(velocity);

    // Space movement already handled above
}

// Update camera rotation only
function updateCamera() {
    // Apply rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

// =========================
// End of Character Integration
// =========================

// Initialize scene (removed terrain creation)

function updateStars() {
    const playerPosition = camera.position;

    // Update background stars to follow camera
    const backgroundStars = scene.getObjectByName('backgroundStars');
    if (backgroundStars) {
        backgroundStars.position.copy(camera.position);
    }

    // Check if we need to spawn new stars
    if (playerPosition.distanceTo(starSystem.lastSpawnPosition) > starSystem.spawnInterval) {
        // Spawn new stars
        for (let i = 0; i < starSystem.spawnCount; i++) {
            const star = createStar(playerPosition);
            starSystem.stars.push(star);
        }
        starSystem.lastSpawnPosition.copy(playerPosition);
    }

    // Remove distant stars
    for (let i = starSystem.stars.length - 1; i >= 0; i--) {
        const star = starSystem.stars[i];
        const distance = playerPosition.distanceTo(star.position);

        if (distance > starSystem.despawnDistance) {
            scene.remove(star.mesh);
            starSystem.stars.splice(i, 1);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = Math.min(clock.getDelta(), 0.1);
    if (assetsLoaded) {
        updatePlayerMovement(deltaTime);
        updateCamera();
        updateStars();
    }

    composer.render();
}

// Handle window resize
function onWindowResize() {
    const width = parentDiv.clientWidth;
    const height = parentDiv.clientHeight;

    // Update camera
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Update renderer and composer
    renderer.setSize(width, height);
    composer.setSize(width, height);

    // Update post-processing passes
    bloomPass.resolution.set(width, height);
    smaaPass.setSize(width, height);
}

// Add event listeners
window.addEventListener('resize', onWindowResize);
const resizeObserver = new ResizeObserver(onWindowResize);
resizeObserver.observe(parentDiv);

// Start animation
animate();