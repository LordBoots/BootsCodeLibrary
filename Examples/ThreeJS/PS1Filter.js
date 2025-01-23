// Import necessary modules
import * as THREE from 'three';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';
import {
    ShaderPass
} from 'three/addons/postprocessing/ShaderPass.js';
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
// PS1 effect configuration
const ps1Config = {
    minPixelSize: 1.0,
    maxPixelSize: 8.0,
    minColorLevels: 16.0,
    maxColorLevels: 128.0,
    pixelSizeStep: 0.5,
    colorLevelsStep: 8.0
};
// Optionally, add URL remapping if needed
loadingManager.setURLModifier((url) => {
    if (url.includes('Textures/colormap.png')) {
        return 'https://play.rosebud.ai/assets/3D_playground_character_colormap.png?aPfy';
    }
    return url;
});

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
loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const progress = ((itemsLoaded / itemsTotal) * 100).toFixed(0);
    loadingScreen.innerHTML = `Loading... ${progress}%`;
};

loadingManager.onLoad = function() {
    assetsLoaded = true;
    loadingScreen.style.display = 'none';
};

loadingManager.onError = function(url) {
    console.error('Error loading:', url);
};

// Initialize the scene
const scene = new THREE.Scene();
const world = new CANNON.World();
world.gravity.set(0, -20, 0);
world.defaultContactMaterial.friction = 0.01; // Reduced global friction
world.defaultContactMaterial.restitution = 0; // No bounce by default
world.solver.iterations = 10;
world.solver.tolerance = 0.001;

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

// Define physics materials
const groundPhysMaterial = new CANNON.Material('ground');

// Define physics material for the ball
const ballPhysMaterial = new CANNON.Material('ballMaterial');

// Create contact material between ball and ground
const ballGroundContactMaterial = new CANNON.ContactMaterial(
    ballPhysMaterial,
    groundPhysMaterial, {
        friction: 0.05, // Lower friction for smoother rolling
        restitution: 0.95, // High restitution for bouncy balls
    }
);
world.addContactMaterial(ballGroundContactMaterial);

// Create contact material between balls
const ballBallContactMaterial = new CANNON.ContactMaterial(
    ballPhysMaterial,
    ballPhysMaterial, {
        friction: 0.05, // Lower friction between balls for easier pushing
        restitution: 0.98, // High restitution between balls for bouncier collisions
    }
);
world.addContactMaterial(ballBallContactMaterial);

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
const cameraSettings = {
    offset: new THREE.Vector3(0, 5, 15),
    smoothSpeed: 0.1,
    rotationSpeed: 0.5,
    minPolarAngle: 0.1,
    maxPolarAngle: Math.PI / 2,
    minDistance: 8,
    maxDistance: 30,
    minFollowDistance: 12,
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

// PS1 Style Shader
const PS1Shader = {
    uniforms: {
        "tDiffuse": {
            value: null
        },
        "resolution": {
            value: new THREE.Vector2(1, 1)
        },
        "pixelSize": {
            value: 4.0
        },
        "colorLevels": {
            value: 32.0
        }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float pixelSize;
        uniform float colorLevels;
        varying vec2 vUv;
        
        void main() {
            vec2 dxy = pixelSize / resolution;
            vec2 coord = dxy * floor(vUv / dxy);
            vec4 color = texture2D(tDiffuse, coord);
            
            // Color depth reduction
            color = floor(color * colorLevels) / colorLevels;
            
            // Add subtle color banding
            color += vec4(0.02) * fract(sin(coord.x * 1000.0 + coord.y * 1000.0));
            
            gl_FragColor = color;
        }
    `
};
// Initialize post-processing
const composer = new EffectComposer(renderer);
// Regular scene render pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
// Add PS1 style pixelation and color reduction
const ps1Pass = new ShaderPass(PS1Shader);
ps1Pass.uniforms.resolution.value.set(canvas.offsetWidth, canvas.offsetHeight);
ps1Pass.uniforms.pixelSize.value = 4.0; // Adjust for more/less pixelation
ps1Pass.uniforms.colorLevels.value = 32.0; // Adjust for color depth
composer.addPass(ps1Pass);
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
const skyColor = new THREE.Color(0x87ceeb); // Bright sky blue
const groundColor = new THREE.Color(0xffffff); // White ground reflection

// Create sky dome with improved colors
const vertexShader = `
varying vec3 vWorldPosition;
void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const fragmentShader = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
    float h = normalize( vWorldPosition + offset ).y;
    gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );
}
`;
const uniforms = {
    topColor: {
        value: skyColor
    },
    bottomColor: {
        value: groundColor
    },
    offset: {
        value: 33
    },
    exponent: {
        value: 0.6
    },
};
const skyGeo = new THREE.SphereGeometry(500, 32, 15);
const skyMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.BackSide,
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// Modify OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minPolarAngle = cameraSettings.minPolarAngle;
controls.maxPolarAngle = cameraSettings.maxPolarAngle;
controls.minDistance = cameraSettings.minDistance;
controls.maxDistance = cameraSettings.maxDistance;
controls.target = new THREE.Vector3(0, 2, 0);

// Create flat terrain
function createTerrain() {
    const size = 200;

    // Create simple flat plane for visuals
    const geometry = new THREE.PlaneGeometry(size, size);
    const texture = textureLoader.load('https://play.rosebud.ai/assets/3D_playground_grass_diffuse.png?TIMr');
    const normalMap = textureLoader.load('https://play.rosebud.ai/assets/3D_playground_grass_normal.png?Nroh');

    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    texture.encoding = THREE.sRGBEncoding;

    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(20, 20);

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(2, 2),
        roughness: 0.8,
        metalness: 0.1,
        envMapIntensity: 1.0,
    });

    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    const groundShape = new CANNON.Box(new CANNON.Vec3(size / 2, 0.1, size / 2));
    const groundBody = new CANNON.Body({
        mass: 0,
        material: groundPhysMaterial,
    });
    groundBody.addShape(groundShape);
    groundBody.position.set(0, -0.1, 0);
    world.addBody(groundBody);

    return terrain;
}

// Setup improved lighting system
const sunLight = new THREE.DirectionalLight(skyColor, 2.0);
sunLight.position.set(-50, 100, -50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 400;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
sunLight.shadow.bias = -0.001;
scene.add(sunLight);

// Add hemisphere light to simulate sky and ground bounce light
const hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 0.6);
scene.add(hemiLight);

// =========================
// Character Integration
// =========================

// Variables for character
let character = null;
let characterBody = null;
let mixer = null;
let isGrounded = false;
let currentJumps = 0;
let lastJumpTime = 0;
let moveDirection = new THREE.Vector3();
let walkAction = null;
let idleAction = null;
let jumpAction = null;
let fallAction = null;
let contactNormal = new CANNON.Vec3();
let upAxis = new CANNON.Vec3(0, 1, 0);

const keysPressed = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
};

// Character configuration
const characterConfig = {
    // Movement settings
    groundSpeed: 30,
    airSpeed: 25,
    groundDamping: 0.1,
    airDamping: 0.1,
    acceleration: 20,
    turnSpeed: 8,
    jumpForce: 12,
    jumpCooldown: 0.1,
    maxJumps: 1,

    // Physics settings
    radius: 2.5, // Collision shape radius
    height: 5, // Increased height to match model's visual height
    mass: 62,
    friction: 0.1,
    restitution: 0.0,
    linearDamping: 0.02,
    angularDamping: 0.9,

    // Visual and animation settings
    scale: 10,
    startHeight: 8,
};

// Define physics materials for character
const characterPhysMaterial = new CANNON.Material('character');

// Create contact material between character and ground
const characterGroundContact = new CANNON.ContactMaterial(
    characterPhysMaterial,
    groundPhysMaterial, {
        friction: 0.01,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
    }
);
world.addContactMaterial(characterGroundContact);

// Create contact material between ball and character
const ballCharacterContactMaterial = new CANNON.ContactMaterial(
    ballPhysMaterial,
    characterPhysMaterial, {
        friction: 0.05,
        restitution: 0.9,
    }
);
world.addContactMaterial(ballCharacterContactMaterial);

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
// Add PS1 effect control listeners
window.addEventListener('keydown', (event) => {
    if (!ps1Pass) return;
    if (event.code === 'ArrowUp') {
        // Increase PS1 effect
        ps1Pass.uniforms.pixelSize.value = Math.min(
            ps1Pass.uniforms.pixelSize.value + ps1Config.pixelSizeStep,
            ps1Config.maxPixelSize
        );
        ps1Pass.uniforms.colorLevels.value = Math.max(
            ps1Pass.uniforms.colorLevels.value - ps1Config.colorLevelsStep,
            ps1Config.minColorLevels
        );
    } else if (event.code === 'ArrowDown') {
        // Decrease PS1 effect
        ps1Pass.uniforms.pixelSize.value = Math.max(
            ps1Pass.uniforms.pixelSize.value - ps1Config.pixelSizeStep,
            ps1Config.minPixelSize
        );
        ps1Pass.uniforms.colorLevels.value = Math.min(
            ps1Pass.uniforms.colorLevels.value + ps1Config.colorLevelsStep,
            ps1Config.maxColorLevels
        );
    }
});

// Load the character model
const characterUrl = 'https://play.rosebud.ai/assets/3D_playground_character.glb?eoaW';
gltfLoader.load(characterUrl, (gltf) => {
    const model = gltf.scene;
    model.scale.set(
        characterConfig.scale,
        characterConfig.scale,
        characterConfig.scale
    );

    // Apply rotation correction if needed
    model.rotation.y = Math.PI; // Correcting the model's rotation

    // Adjust model's position so feet are on the ground
    model.position.set(0, 0, 0);

    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.envMapIntensity = 1.0;
        }
    });

    // Create character physics body
    characterBody = new CANNON.Body({
        mass: characterConfig.mass,
        material: characterPhysMaterial,
        linearDamping: characterConfig.linearDamping,
        angularDamping: characterConfig.angularDamping,
        fixedRotation: true,
        type: CANNON.Body.DYNAMIC,
    });

    const characterShape = new CANNON.Cylinder(
        characterConfig.radius,
        characterConfig.radius,
        characterConfig.height,
        8
    );
    // Adjust shapeOffset to align collision shape with the character model
    const shapeOffset = new CANNON.Vec3(0, characterConfig.height / 2, 0);
    characterBody.addShape(characterShape, shapeOffset);
    characterBody.position.set(0, characterConfig.startHeight, 0);
    world.addBody(characterBody);

    // Reset contact tracking
    isGrounded = false;
    let groundContactCount = 0;

    characterBody.addEventListener('collide', (event) => {
        const contact = event.contact;
        let otherBody;
        if (event.contact.bi === characterBody) {
            otherBody = event.contact.bj;
            contact.ni.negate(contactNormal);
        } else {
            otherBody = event.contact.bi;
            contactNormal.copy(contact.ni);
        }

        if (contactNormal.dot(upAxis) > 0.5) {
            groundContactCount++;
            isGrounded = true;
            currentJumps = 0;

            // Reset animations for ground state
            if (fallAction) {
                fallAction.stop();
                fallAction.setEffectiveWeight(0);
            }
            if (jumpAction) {
                jumpAction.stop();
                jumpAction.setEffectiveWeight(0);
            }
        }
    });

    characterBody.addEventListener('endContact', (event) => {
        let otherBody;
        if (event.contact.bi === characterBody) {
            otherBody = event.contact.bj;
            event.contact.ni.negate(contactNormal);
        } else {
            otherBody = event.contact.bi;
            contactNormal.copy(event.contact.ni);
        }

        if (contactNormal.dot(upAxis) > 0.5) {
            groundContactCount = Math.max(0, groundContactCount - 1);
            if (groundContactCount === 0) {
                isGrounded = false;
            }
        }
    });

    // Setup animations
    mixer = new THREE.AnimationMixer(model);

    const idleClip = gltf.animations.find((clip) => clip.name.toLowerCase().includes('idle'));
    const walkClip = gltf.animations.find((clip) => clip.name.toLowerCase().includes('walk'));
    const jumpClip = gltf.animations.find((clip) => clip.name.toLowerCase().includes('jump'));
    const fallClip = gltf.animations.find((clip) => clip.name.toLowerCase().includes('fall'));

    if (idleClip) {
        idleAction = mixer.clipAction(idleClip);
        idleAction.play();
        idleAction.setEffectiveWeight(1);
    }

    if (walkClip) {
        walkAction = mixer.clipAction(walkClip);
        walkAction.play();
        walkAction.setEffectiveWeight(0);
    }

    if (jumpClip) {
        jumpAction = mixer.clipAction(jumpClip);
        jumpAction.setLoop(THREE.LoopOnce);
        jumpAction.clampWhenFinished = true;
        jumpAction.setEffectiveWeight(0);
    }

    if (fallClip) {
        fallAction = mixer.clipAction(fallClip);
        fallAction.setLoop(THREE.LoopRepeat);
        fallAction.setEffectiveWeight(0);
    }

    character = model;
    scene.add(model);
});

// Update character movement
function updateCharacterMovement(deltaTime) {
    if (!character || !characterBody) return;

    // Get camera's forward and right vectors
    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();

    camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();

    cameraRight.crossVectors(new THREE.Vector3(0, 1, 0), cameraForward).normalize();

    // Calculate move direction relative to camera
    moveDirection.set(0, 0, 0);

    // Add movement input
    if (keysPressed.w) moveDirection.add(cameraForward);
    if (keysPressed.s) moveDirection.sub(cameraForward);
    if (keysPressed.a) moveDirection.add(cameraRight);
    if (keysPressed.d) moveDirection.sub(cameraRight);

    // Normalize movement direction if it exists
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
    }

    // Get current horizontal velocity
    const currentVelocity = new THREE.Vector2(characterBody.velocity.x, characterBody.velocity.z);

    // Different handling for ground vs air movement
    if (isGrounded) {
        // Ground movement
        if (moveDirection.length() > 0) {
            // Calculate target velocity
            const targetVelocity = new THREE.Vector2(
                moveDirection.x * characterConfig.groundSpeed,
                moveDirection.z * characterConfig.groundSpeed
            );

            // Interpolate current velocity towards target
            currentVelocity.lerp(targetVelocity, characterConfig.acceleration * deltaTime);

            // Update character rotation
            const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
            let currentAngle = character.rotation.y;

            // Calculate shortest rotation distance
            let angleDiff = targetAngle - currentAngle;
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            // Smoothly rotate character
            character.rotation.y += angleDiff * characterConfig.turnSpeed * deltaTime;
            characterBody.quaternion.setFromEuler(0, character.rotation.y, 0);
        } else {
            // Apply ground damping when no input
            currentVelocity.multiplyScalar(1 - characterConfig.groundDamping * deltaTime);
        }
    } else {
        // Air movement
        if (moveDirection.length() > 0) {
            const airVelocity = new THREE.Vector2(
                moveDirection.x * characterConfig.airSpeed * deltaTime,
                moveDirection.z * characterConfig.airSpeed * deltaTime
            );
            currentVelocity.add(airVelocity);

            // Clamp air speed
            const maxAirSpeed = characterConfig.airSpeed;
            if (currentVelocity.length() > maxAirSpeed) {
                currentVelocity.normalize().multiplyScalar(maxAirSpeed);
            }
        } else {
            // Apply air damping when no input
            currentVelocity.multiplyScalar(1 - characterConfig.airDamping * deltaTime);
        }
    }

    // Apply calculated velocity
    characterBody.velocity.x = currentVelocity.x;
    characterBody.velocity.z = currentVelocity.y;

    // Handle jumping
    if (keysPressed.space && isGrounded && currentJumps < characterConfig.maxJumps) {
        const now = performance.now();
        if (now - lastJumpTime > characterConfig.jumpCooldown * 1000) {
            characterBody.velocity.y = characterConfig.jumpForce;
            currentJumps++;
            lastJumpTime = now;
            isGrounded = false;

            if (jumpAction) {
                jumpAction.reset();
                jumpAction.setEffectiveWeight(1);
                jumpAction.play();
            }
        }
    }

    // Update animations
    if (mixer && walkAction && idleAction && jumpAction && fallAction) {
        const verticalVelocity = characterBody.velocity.y;
        const horizontalSpeed = new THREE.Vector2(characterBody.velocity.x, characterBody.velocity.z).length();

        if (!isGrounded) {
            // Air state
            walkAction.stop();
            idleAction.stop();

            if (verticalVelocity > 1) {
                // Rising
                fallAction.stop();
                jumpAction.play();
                jumpAction.setEffectiveWeight(1);
            } else {
                // Falling
                jumpAction.stop();
                fallAction.play();
                fallAction.setEffectiveWeight(1);
            }
        } else {
            // Ground state
            jumpAction.stop();
            fallAction.stop();

            if (horizontalSpeed > 0.1) {
                idleAction.stop();
                walkAction.play();
                walkAction.setEffectiveWeight(1);
            } else {
                walkAction.stop();
                idleAction.play();
                idleAction.setEffectiveWeight(1);
            }
        }
    }

    // Update animation mixer
    if (mixer) {
        mixer.update(deltaTime);
    }
}

// Update camera to follow the character
function updateCamera() {
    if (!character) return;

    // Get character's position and current camera direction
    const characterPos = character.position.clone();
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);

    // Calculate target position (character's upper body)
    let targetPosition = characterPos.clone().add(new THREE.Vector3(0, characterConfig.height / 2, 0));

    // Get camera's current horizontal distance to character
    const cameraToCharacter = new THREE.Vector3();
    cameraToCharacter.subVectors(camera.position, characterPos);
    cameraToCharacter.y = 0; // Ignore vertical distance
    const currentDistance = cameraToCharacter.length();

    // Check if character is moving towards camera
    const movementTowardCamera = moveDirection.dot(cameraToCharacter.normalize()) < 0;

    // Adjust camera position if too close
    if (movementTowardCamera && currentDistance < cameraSettings.minFollowDistance) {
        const idealOffset = cameraToCharacter.normalize().multiplyScalar(cameraSettings.minFollowDistance);
        idealOffset.y = camera.position.y - characterPos.y;

        const newCameraPos = characterPos.clone().add(idealOffset);
        camera.position.lerp(newCameraPos, cameraSettings.smoothSpeed * 2);
    }

    // Update OrbitControls target
    controls.target.lerp(targetPosition, cameraSettings.smoothSpeed);

    // Update controls
    controls.update();
}

// =========================
// End of Character Integration
// =========================

// Create initial scene
const terrain = createTerrain();

/**
 * Variables for ball spawning
 */
const ballSpawnInterval = 1; // seconds between ball spawns
let timeSinceLastBall = 0;
const balls = [];
const maxBalls = 20; // Limit the number of balls

/**
 * Function to spawn a new bouncy ball with a random color
 */
function spawnBall() {
    // Remove oldest ball if we have reached maxBalls
    if (balls.length >= maxBalls) {
        const oldestBall = balls.shift();
        scene.remove(oldestBall.mesh);
        world.removeBody(oldestBall.body);
    }

    // Set ball size (radius)
    const ballSize = randomBetween(1, 3); // Random ball size

    // Create a sphere geometry with the specified size
    const radius = ballSize;
    const widthSegments = 32;
    const heightSegments = 32;
    const ballGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

    // Create a material with a random color
    const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: randomColor
    });

    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;

    // Initialize userData
    ballMesh.userData = {};

    // Set initial position - spawn above the ground
    const x = Math.random() * 20 - 10;
    const y = 10;
    const z = Math.random() * 20 - 10;
    ballMesh.position.set(x, y, z);
    scene.add(ballMesh);

    // Create physics body with the same size
    const ballShape = new CANNON.Sphere(radius);

    // Set light mass but keep dynamic behavior
    const mass = 1;
    const ballBody = new CANNON.Body({
        mass: mass,
        shape: ballShape,
        material: ballPhysMaterial,
        position: new CANNON.Vec3(x, y, z),
    });

    ballBody.type = CANNON.Body.DYNAMIC;

    // Reduce linear damping for more rolling effect
    ballBody.linearDamping = 0.01;
    ballBody.angularDamping = 0.01;

    // Initialize userData
    ballBody.userData = {};

    // Link mesh and physics body
    ballMesh.userData.physicsBody = ballBody;
    ballBody.userData.mesh = ballMesh;

    // Add ball body to the world
    world.addBody(ballBody);

    // Store the balls in an array
    balls.push({
        mesh: ballMesh,
        body: ballBody
    });
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.1);

    if (assetsLoaded) {
        world.step(deltaTime);

        updateCharacterMovement(deltaTime); // Update character movement
        updateCamera(); // Update camera to follow character

        if (character && characterBody) {
            // Adjust the character model's position based on the physics body
            character.position.copy(characterBody.position);
        }

        /**
         * Spawn balls every few seconds
         */
        timeSinceLastBall += deltaTime;
        if (timeSinceLastBall >= ballSpawnInterval) {
            spawnBall();
            timeSinceLastBall = 0;
        }

        // Update balls positions and remove those that fall off
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            // Update mesh position and rotation
            ball.mesh.position.copy(ball.body.position);
            ball.mesh.quaternion.copy(ball.body.quaternion);

            // Check if the ball has fallen below a certain Y position
            if (ball.body.position.y < -10) {
                // Remove the ball from the scene and physics world
                scene.remove(ball.mesh);
                world.removeBody(ball.body);
                // Remove the ball from the balls array
                balls.splice(i, 1);
            }
        }

        // No need to call controls.update() here as it's called in updateCamera()
    }

    composer.render();
}

// Handle window resize
function onWindowResize() {
    const width = parentDiv.clientWidth;
    const height = parentDiv.clientHeight;
    // Update PS1 shader resolution
    if (ps1Pass) {
        ps1Pass.uniforms.resolution.value.set(width, height);
    }

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
// Create help text
const helpText = document.createElement('div');
helpText.style.position = 'absolute';
helpText.style.bottom = '20px';
helpText.style.left = '50%';
helpText.style.transform = 'translateX(-50%)';
helpText.style.color = 'white';
helpText.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
helpText.style.padding = '8px 16px';
helpText.style.borderRadius = '4px';
helpText.style.fontFamily = 'Arial, sans-serif';
helpText.style.fontSize = '14px';
helpText.style.userSelect = 'none';
helpText.style.pointerEvents = 'none';
helpText.textContent = '↑↓ to change PSX effect';
parentDiv.appendChild(helpText);
// Start animation
animate();