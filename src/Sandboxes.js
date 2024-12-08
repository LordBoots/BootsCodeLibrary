const THEME = {
    colors: {
        accent: '#4a80b4', // Mellow blue for general accents
        separator: '#4ac4c0', // Watercolor teal for separators
        categoryFill: '#2a2a3a', // Category background
        categoryHeader: '#3a3a4a', // Category header background
        subcategoryFill: '#333333', // Subcategory background
        subcategoryHeader: '#404040' // Subcategory header background
    }
};
export class ThreeJSSandbox {
    constructor() {
        this.modalContainer = null;
        this.iframe = null;
    }
    loadScript(code) {
        try {
            this.createModal();
            this.createIframeContainer();
            this.createCloseButton();
            this.setupHTML(code);
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ Error creating iframe:', error);
            console.error(error.stack);
        }
    }
    createModal() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.style.position = 'fixed';
        this.modalContainer.style.top = '0';
        this.modalContainer.style.left = '0';
        this.modalContainer.style.width = '100%';
        this.modalContainer.style.height = '100%';
        this.modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.modalContainer.style.zIndex = '9999';
        this.modalContainer.style.display = 'flex';
        this.modalContainer.style.justifyContent = 'center';
        this.modalContainer.style.alignItems = 'center';
    }
    createIframeContainer() {
        const iframeContainer = document.createElement('div');
        iframeContainer.style.position = 'relative';
        iframeContainer.style.width = 'calc(100% - 160px)';
        iframeContainer.style.height = 'calc(100% - 160px)';
        iframeContainer.style.backgroundColor = '#000';
        iframeContainer.style.border = `3px solid ${THEME.colors.accent}`;
        iframeContainer.style.borderRadius = '15px';
        iframeContainer.style.overflow = 'hidden';
        this.iframe = document.createElement('iframe');
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.border = 'none';
        this.iframe.style.backgroundColor = '#000';
        this.iframe.sandbox = 'allow-scripts allow-same-origin allow-modals allow-presentation allow-storage-access-by-user-activation';
        iframeContainer.appendChild(this.iframe);
        this.modalContainer.appendChild(iframeContainer);
        document.body.appendChild(this.modalContainer);
    }
    createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '10px';
        closeButton.style.top = '10px';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.backgroundColor = '#ff4444';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.color = '#fff';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '10000';
        closeButton.onclick = () => this.cleanup();

        const iframeContainer = this.iframe.parentElement;
        iframeContainer.appendChild(closeButton);
    }
    setupHTML(code) {
        const htmlContent = this.generateHTML(code);
        const blob = new Blob([htmlContent.trim()], {
            type: 'text/html;charset=utf-8'
        });
        const blobURL = URL.createObjectURL(blob);
        this.iframe.src = blobURL;
        this.iframe.onload = () => {
            URL.revokeObjectURL(blobURL);
            console.log('✅ Successfully created iframe game instance');
        };
    }
    setupEventListeners() {
        // No click listener for modal container - only close via X button
    }
    cleanup() {
        if (this.iframe?.contentWindow) {
            this.iframe.contentWindow.location.reload();
        }
        this.modalContainer?.remove();
        this.modalContainer = null;
        this.iframe = null;
    }
    generateHTML(code) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
                <script type="importmap">
                {
                    "imports": {
                        "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.152.2/three.module.js",
                        "three/addons/controls/OrbitControls.js": "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js",
                        "three/addons/postprocessing/EffectComposer.js": "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/EffectComposer.js",
                        "three/addons/postprocessing/RenderPass.js": "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/RenderPass.js",
                        "three/addons/postprocessing/UnrealBloomPass.js": "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/UnrealBloomPass.js",
                        "three/addons/postprocessing/SMAAPass.js": "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/SMAAPass.js"
                    }
                }
                </script>
            </head>
            <body>
                <canvas id="threeRenderCanvas"></canvas>
                <script type="module">
                import * as THREE from 'three';
                window.THREE = THREE;
                window.CANNON = CANNON;
                window.executeModuleScript = async (scriptCode) => {
                    try {
                        const blob = new Blob([scriptCode], { type: 'text/javascript' });
                        const url = URL.createObjectURL(blob);
                        await import(url);
                        URL.revokeObjectURL(url);
                        console.log('✅ Module script executed successfully');
                    } catch (error) {
                        console.warn('⚠️ Error in module script execution:', error);
                    }
                };
            </script>
            <style>
                body { margin: 0; padding: 0; width: 100vw; height: 100vh; background: #000; overflow: hidden; }
                #threeRenderCanvas { width: 100%; height: 100%; display: block; }
            </style>
            <script>
                window.sharedStorage = {
                    localStorage: window.localStorage,
                    indexedDB: window.indexedDB,
                    sessionStorage: window.sessionStorage
                };
                window.addEventListener('message', (event) => {
                    if (event.data.type === 'storage-request') {
                        const { storageType, method, key, value } = event.data;
                        try {
                            switch(method) {
                                case 'getItem':
                                    const item = window.sharedStorage[storageType].getItem(key);
                                    event.source.postMessage({
                                        type: 'storage-response',
                                        value: item
                                    }, '*');
                                    break;
                                case 'setItem':
                                    window.sharedStorage[storageType].setItem(key, value);
                                    break;
                                case 'removeItem':
                                    window.sharedStorage[storageType].removeItem(key);
                                    break;
                                case 'clear':
                                    window.sharedStorage[storageType].clear();
                                    break;
                            }
                        } catch (error) {
                            console.error('Storage operation failed:', error);
                        }
                    }
                });
                const executeScript = async (scriptCode) => {
                    try {
                        scriptCode = scriptCode.replace(/document\.getElementById\(['"]renderDiv['"]\)/g, 
                            'document.getElementById("threeRenderCanvas")');
                        scriptCode = scriptCode.replace(/['"]renderDiv['"]/g, '"threeRenderCanvas"');
                        
                        if (scriptCode.includes('import ')) {
                            await window.executeModuleScript(scriptCode);
                        } else {
                            const scriptFunction = new Function(scriptCode);
                            scriptFunction();
                        }
                        console.log('✅ Script executed successfully');
                    } catch (error) {
                        console.warn('⚠️ Error in script execution:', error);
                    }
                };
                const maxWaitTime = 2000;
                const checkInterval = 100;
                let waitTime = 0;
                const tryExecuteScript = () => {
                    if (waitTime >= maxWaitTime) {
                        console.warn('⚠️ Timeout waiting for dependencies - attempting execution anyway');
                        executeScript(${JSON.stringify(code)});
                        return;
                    }
                    if (document.readyState === 'complete') {
                        executeScript(${JSON.stringify(code)});
                    } else {
                        waitTime += checkInterval;
                        setTimeout(tryExecuteScript, checkInterval);
                    }
                };
                tryExecuteScript();
            </script>
            </html>
        `;
    }
}
export class PhaserSandbox {
    constructor() {
        this.modalContainer = null;
        this.iframe = null;
    }
    loadScript(code) {
        try {
            this.createModal();
            this.createIframeContainer();
            this.createCloseButton();
            this.setupHTML(code);
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ Error creating iframe:', error);
            console.error(error.stack);
        }
    }
    createModal() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.style.position = 'fixed';
        this.modalContainer.style.top = '0';
        this.modalContainer.style.left = '0';
        this.modalContainer.style.width = '100%';
        this.modalContainer.style.height = '100%';
        this.modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.modalContainer.style.zIndex = '9999';
        this.modalContainer.style.display = 'flex';
        this.modalContainer.style.justifyContent = 'center';
        this.modalContainer.style.alignItems = 'center';
    }
    createIframeContainer() {
        const iframeContainer = document.createElement('div');
        iframeContainer.style.position = 'relative';
        iframeContainer.style.width = '80%';
        iframeContainer.style.height = '80%';
        iframeContainer.style.backgroundColor = '#000';
        iframeContainer.style.maxWidth = '1600px';
        iframeContainer.style.maxHeight = '900px';
        iframeContainer.style.border = `3px solid ${THEME.colors.accent}`;
        iframeContainer.style.borderRadius = '15px';
        iframeContainer.style.overflow = 'hidden';
        this.iframe = document.createElement('iframe');
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.border = 'none';
        this.iframe.style.backgroundColor = '#000';
        this.iframe.sandbox = 'allow-scripts allow-same-origin allow-modals allow-presentation allow-storage-access-by-user-activation';
        iframeContainer.appendChild(this.iframe);
        this.modalContainer.appendChild(iframeContainer);
        document.body.appendChild(this.modalContainer);
    }
    createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '10px';
        closeButton.style.top = '10px';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.backgroundColor = '#ff4444';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.color = '#fff';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '10000';
        closeButton.onclick = () => this.cleanup();

        const iframeContainer = this.iframe.parentElement;
        iframeContainer.appendChild(closeButton);
    }
    setupHTML(code) {
        const htmlContent = this.generateHTML(code);
        const blob = new Blob([htmlContent.trim()], {
            type: 'text/html;charset=utf-8'
        });
        const blobURL = URL.createObjectURL(blob);
        this.iframe.src = blobURL;
        this.iframe.onload = () => {
            URL.revokeObjectURL(blobURL);
            console.log('✅ Successfully created iframe Phaser instance');
        };
    }
    setupEventListeners() {
        // No click listener for modal container - only close via X button
    }
    cleanup() {
        if (this.iframe?.contentWindow) {
            this.iframe.contentWindow.location.reload();
        }
        this.modalContainer?.remove();
        this.modalContainer = null;
        this.iframe = null;
    }
    generateHTML(code) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"></script>
            </head>
            <body>
                <div id="game"></div>
                <script type="module">
                    window.executeModuleScript = async (scriptCode) => {
                        try {
                            const blob = new Blob([scriptCode], { type: 'text/javascript' });
                            const url = URL.createObjectURL(blob);
                            await import(url);
                            URL.revokeObjectURL(url);
                            console.log('✅ Module script executed successfully');
                        } catch (error) {
                            console.warn('⚠️ Error in module script execution:', error);
                        }
                    };
                </script>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0;
                        background: #000;
                        width: 100%;
                        height: 100vh;
                        overflow: hidden;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    #game {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        position: absolute;
                    }
                    canvas {
                        width: 100% !important;
                        height: 100% !important;
                    }
                </style>
                <script>
                    window.sharedStorage = {
                        localStorage: window.localStorage,
                        indexedDB: window.indexedDB,
                        sessionStorage: window.sessionStorage
                    };
                    window.addEventListener('message', (event) => {
                        if (event.data.type === 'storage-request') {
                            const { storageType, method, key, value } = event.data;
                            try {
                                switch(method) {
                                    case 'getItem':
                                        const item = window.sharedStorage[storageType].getItem(key);
                                        event.source.postMessage({
                                            type: 'storage-response',
                                            value: item
                                        }, '*');
                                        break;
                                    case 'setItem':
                                        window.sharedStorage[storageType].setItem(key, value);
                                        break;
                                    case 'removeItem':
                                        window.sharedStorage[storageType].removeItem(key);
                                        break;
                                    case 'clear':
                                        window.sharedStorage[storageType].clear();
                                        break;
                                }
                            } catch (error) {
                                console.error('Storage operation failed:', error);
                            }
                        }
                    });
                    const executeScript = async (scriptCode) => {
                        try {
                            // Check if code contains imports
                            if (scriptCode.includes('import ')) {
                                await window.executeModuleScript(scriptCode);
                                return;
                            }
                            
                            // Execute the code with error handling
                            const scriptFunction = new Function(scriptCode);
                            scriptFunction();
                            
                            console.log('✅ Script executed successfully');
                        } catch (error) {
                            console.warn('⚠️ Error in script execution:', error);
                        }
                    };
                    const maxWaitTime = 2000;
                    const checkInterval = 100;
                    let waitTime = 0;
                    const tryExecuteScript = () => {
                        if (waitTime >= maxWaitTime) {
                            console.warn('⚠️ Timeout waiting for dependencies - attempting execution anyway');
                            executeScript(${JSON.stringify(code)});
                            return;
                        }
                        if (document.readyState === 'complete') {
                            executeScript(${JSON.stringify(code)});
                        } else {
                            waitTime += checkInterval;
                            setTimeout(tryExecuteScript, checkInterval);
                        }
                    };
                    tryExecuteScript();
                </script>
            </body>
            </html>
        `;
    }
}
export class SkyboxShaderSandbox {
    constructor() {
        this.modalContainer = null;
        this.iframe = null;
    }
    loadScript(code) {
        try {
            this.createModal();
            this.createIframeContainer();
            this.createCloseButton();
            this.setupHTML(code);
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ Error creating iframe:', error);
            console.error(error.stack);
        }
    }
    createModal() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.style.position = 'fixed';
        this.modalContainer.style.top = '0';
        this.modalContainer.style.left = '0';
        this.modalContainer.style.width = '100%';
        this.modalContainer.style.height = '100%';
        this.modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.modalContainer.style.zIndex = '9999';
        this.modalContainer.style.display = 'flex';
        this.modalContainer.style.justifyContent = 'center';
        this.modalContainer.style.alignItems = 'center';
    }
    createIframeContainer() {
        const iframeContainer = document.createElement('div');
        iframeContainer.style.position = 'relative';
        iframeContainer.style.width = 'calc(100% - 160px)';
        iframeContainer.style.height = 'calc(100% - 160px)';
        iframeContainer.style.backgroundColor = '#000';
        iframeContainer.style.border = `3px solid ${THEME.colors.accent}`;
        iframeContainer.style.borderRadius = '15px';
        iframeContainer.style.overflow = 'hidden';
        this.iframe = document.createElement('iframe');
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.border = 'none';
        this.iframe.style.backgroundColor = '#000';
        this.iframe.sandbox = 'allow-scripts allow-same-origin';
        iframeContainer.appendChild(this.iframe);
        this.modalContainer.appendChild(iframeContainer);
        document.body.appendChild(this.modalContainer);
    }
    createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '10px';
        closeButton.style.top = '10px';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.backgroundColor = '#ff4444';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.color = '#fff';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '10000';
        closeButton.onclick = () => this.cleanup();
        const iframeContainer = this.iframe.parentElement;
        iframeContainer.appendChild(closeButton);
    }
    setupHTML(code) {
        // Find the first constant declaration and replace its name with 'shaderCode'
        code = code.replace(/(?:const|let|var)\s+(\w+)\s*=/, 'const shaderCode =');
        const htmlContent = this.generateHTML(code);
        const blob = new Blob([htmlContent.trim()], {
            type: 'text/html;charset=utf-8'
        });
        const blobURL = URL.createObjectURL(blob);
        this.iframe.src = blobURL;
        this.iframe.onload = () => {
            URL.revokeObjectURL(blobURL);
            console.log('✅ Successfully created iframe shader instance');
        };
    }
    setupEventListeners() {
        // No click listener for modal container - only close via X button
    }
    cleanup() {
        if (this.iframe?.contentWindow) {
            this.iframe.contentWindow.location.reload();
        }
        this.modalContainer?.remove();
        this.modalContainer = null;
        this.iframe = null;
    }
    generateHTML(code) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <script type="importmap">
                {
                    "imports": {
                        "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.152.2/three.module.js",
                        "three/addons/controls/OrbitControls.js": "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js"
                    }
                }
                </script>
            </head>
            <body>
                <canvas id="shaderCanvas"></canvas>
                <div id="eKeyHint" class="hint-container">Press 'E' for Uniform settings</div>
                <div id="uniformPanel">
                    <div class="panel-header">Shader Uniforms</div>
                    <div class="panel-content">
                        <div style="color: #999; text-align: center; padding: 20px;">
                            Uniform controls will appear here
                        </div>
                    </div>
                    <div class="key-hint">Press E to toggle panel</div>
                </div>
                <script type="module">
                    import * as THREE from 'three';
                    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
                    ${code}
                    
                    // Setup scene
                    const scene = new THREE.Scene();
                    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                    const renderer = new THREE.WebGLRenderer({ 
                        canvas: document.getElementById('shaderCanvas'),
                        antialias: true 
                    });
                    
                    // Create orbit controls
                    const controls = new OrbitControls(camera, renderer.domElement);
                    controls.enableZoom = false;
                    controls.enablePan = false;
                    controls.rotateSpeed = 1.0;
                    
                    // Create a skybox sphere with shader material
                    const geometry = new THREE.SphereGeometry(750, 60, 40);
                    let material;
                    
                    // Use the unified shaderCode constant
                    material = new THREE.ShaderMaterial({
                        ...shaderCode,
                        side: THREE.BackSide
                    });
                    
                    const skybox = new THREE.Mesh(geometry, material);
                    scene.add(skybox);
                    
                    // Position camera
                    camera.position.set(0, 0, 0.1);
                    
                    // Setup uniform controls
                    const createColorSlider = (container, uniform, value) => {
                        const colorContainer = document.createElement('div');
                        colorContainer.style.marginTop = '5px';
                        colorContainer.style.display = 'flex';
                        colorContainer.style.alignItems = 'center';
                        
                        // Create color picker
                        const colorPicker = document.createElement('input');
                        colorPicker.type = 'color';
                        colorPicker.value = '#' + value.getHexString();
                        colorPicker.style.width = '50px';
                        colorPicker.style.height = '30px';
                        colorPicker.style.marginRight = '10px';
                        colorPicker.style.cursor = 'pointer';
                        
                        // Create hex display
                        const hexDisplay = document.createElement('span');
                        hexDisplay.style.color = '#999';
                        hexDisplay.style.fontSize = '14px';
                        hexDisplay.textContent = colorPicker.value.toUpperCase();
                        
                        colorPicker.oninput = () => {
                            const color = new THREE.Color(colorPicker.value);
                            value.copy(color);
                            hexDisplay.textContent = colorPicker.value.toUpperCase();
                        };
                        
                        colorContainer.appendChild(colorPicker);
                        colorContainer.appendChild(hexDisplay);
                        container.appendChild(colorContainer);
                    };
                    
                    const createCategoryContainer = (name) => {
                        const container = document.createElement('div');
                        container.className = 'uniform-category';
                        container.style.marginBottom = '15px';
                        container.style.backgroundColor = '#2a2a3a';
                        container.style.border = '1px solid #4a80b4';
                        container.style.borderRadius = '6px';
                        container.style.overflow = 'hidden';
                        const header = document.createElement('div');
                        header.className = 'category-header';
                        header.textContent = name.slice(1); // Remove underscore prefix
                        header.style.padding = '8px 12px';
                        header.style.backgroundColor = '#3a3a4a';
                        header.style.color = '#fff';
                        header.style.cursor = 'pointer';
                        header.style.fontWeight = 'bold';
                        header.style.display = 'flex';
                        header.style.justifyContent = 'space-between';
                        header.style.alignItems = 'center';
                        const arrow = document.createElement('span');
                        arrow.textContent = '▼';
                        arrow.style.transition = 'transform 0.3s';
                        header.appendChild(arrow);
                        const content = document.createElement('div');
                        content.className = 'category-content';
                        content.style.padding = '10px';
                        header.onclick = () => {
                            const isExpanded = content.style.display !== 'none';
                            content.style.display = isExpanded ? 'none' : 'block';
                            arrow.style.transform = isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)';
                        };
                        container.appendChild(header);
                        container.appendChild(content);
                        return { container, content };
                    };
                    const setupUniformControls = () => {
                        const panelContent = document.querySelector('.panel-content');
                        panelContent.innerHTML = ''; // Clear default content
                        
                        if (!material.uniforms) return;
                        
                        let currentCategory = null;
                        let currentCategoryContent = null;
                        let uncategorizedContainer = document.createElement('div');
                        
                        Object.entries(material.uniforms).forEach(([name, uniform]) => {
                            if (!uniform || !uniform.value) return;
                            
                            // Skip reserved uniforms
                            if (['iResolution', 'iTime', 'iMouse', 'time', 'mouse', 'resolution'].includes(name)) return;
                            
                            // Check if this is a category uniform (starts with underscore)
                            if (name.startsWith('_')) {
                                const { container, content } = createCategoryContainer(name);
                                panelContent.appendChild(container);
                                currentCategory = container;
                                currentCategoryContent = content;
                                return;
                            }
                            
                            const controlContainer = document.createElement('div');
                            controlContainer.style.marginBottom = '15px';
                            
                            const label = document.createElement('div');
                            label.textContent = name;
                            label.style.marginBottom = '5px';
                            label.style.color = '#fff';
                            
                            controlContainer.appendChild(label);
                            
                            const value = uniform.value;
                            
                            if (typeof value === 'number') {
                                createScalarSlider(controlContainer, uniform, value);
                            } else if (value && value.isVector2) {
                                createVectorSlider(controlContainer, uniform, ['x', 'y']);
                            } else if (value && value.isVector3) {
                                createVectorSlider(controlContainer, uniform, ['x', 'y', 'z']);
                            } else if ((value && value.isColor) || ['topColor', 'bottomColor', 'sunColor'].includes(name)) {
                                createColorSlider(controlContainer, uniform, value);
                            }
                            
                            // Add control to current category or uncategorized container
                            if (currentCategoryContent) {
                                currentCategoryContent.appendChild(controlContainer);
                            } else {
                                uncategorizedContainer.appendChild(controlContainer);
                            }
                        });
                        
                        // Add uncategorized controls if any exist
                        if (uncategorizedContainer.children.length > 0) {
                            panelContent.appendChild(uncategorizedContainer);
                        }
                    };
                    
                    const createScalarSlider = (container, uniform, value) => {
                        const slider = document.createElement('input');
                        slider.type = 'range';
                        slider.style.width = '100%';
                        
                        const magnitude = Math.abs(value) || 1;
                        slider.min = -magnitude * 2;
                        slider.max = magnitude * 2;
                        slider.step = (slider.max - slider.min) / 100;
                        slider.value = value;
                        
                        const valueDisplay = document.createElement('div');
                        valueDisplay.style.color = '#999';
                        valueDisplay.style.fontSize = '12px';
                        valueDisplay.style.marginTop = '2px';
                        valueDisplay.textContent = value.toFixed(2);
                        
                        slider.oninput = () => {
                            const newValue = parseFloat(slider.value);
                            uniform.value = newValue;
                            valueDisplay.textContent = newValue.toFixed(2);
                        };
                        
                        container.appendChild(slider);
                        container.appendChild(valueDisplay);
                    }
                    
                    const createVectorSlider = (container, uniform, axes) => {
                        const sliderContainer = document.createElement('div');
                        sliderContainer.style.marginTop = '5px';
                        
                        // Check if the value is a THREE.Color
                        if (uniform.value && (uniform.value.isColor || uniform.value instanceof THREE.Color)) {
                            createColorSlider(container, uniform, uniform.value);
                            return;
                        }
                        
                        axes.forEach(axis => {
                            const axisContainer = document.createElement('div');
                            axisContainer.style.marginBottom = '8px';
                            
                            const axisLabel = document.createElement('span');
                            axisLabel.textContent = axis.toUpperCase() + ': ';
                            axisLabel.style.color = '#999';
                            axisLabel.style.marginRight = '8px';
                            axisLabel.style.display = 'inline-block';
                            axisLabel.style.width = '20px';
                            
                            const slider = document.createElement('input');
                            slider.type = 'range';
                            slider.style.width = 'calc(100% - 80px)';
                            slider.style.display = 'inline-block';
                            const magnitude = Math.abs(uniform.value[axis]) || 1;
                            slider.min = -magnitude * 2;
                            slider.max = magnitude * 2;
                            slider.step = 0.01;
                            slider.value = uniform.value[axis];
                            
                            const valueDisplay = document.createElement('span');
                            valueDisplay.style.color = '#999';
                            valueDisplay.style.fontSize = '12px';
                            valueDisplay.style.marginLeft = '8px';
                            valueDisplay.style.display = 'inline-block';
                            valueDisplay.style.width = '40px';
                            valueDisplay.textContent = uniform.value[axis].toFixed(2);
                            
                            slider.oninput = () => {
                                const newValue = parseFloat(slider.value);
                                const currentValues = {};
                                axes.forEach(a => currentValues[a] = uniform.value[a]);
                                currentValues[axis] = newValue;
                                uniform.value.set(...Object.values(currentValues));
                                valueDisplay.textContent = newValue.toFixed(2);
                            };
                            
                            axisContainer.appendChild(axisLabel);
                            axisContainer.appendChild(slider);
                            axisContainer.appendChild(valueDisplay);
                            sliderContainer.appendChild(axisContainer);
                        });
                        
                        container.appendChild(sliderContainer);
                    }
                    
                    // Setup panel toggle with proper initialization
                    const panel = document.getElementById('uniformPanel');
                    panel.style.right = '-450px'; // Ensure panel starts hidden
                    
                    setupUniformControls(); // Initialize uniform controls
                    
                    const togglePanel = (event) => {
                        if (event.key.toLowerCase() === 'e') {
                            const isVisible = panel.style.right === '0px';
                            panel.style.right = isVisible ? '-450px' : '0px';
                            const hint = document.getElementById('eKeyHint');
                            hint.style.display = isVisible ? 'block' : 'none';
                            event.preventDefault(); // Prevent any default 'e' key behavior
                        }
                    };
                    
                    // Add event listener
                    document.addEventListener('keydown', togglePanel);
                    
                    // Clean up on window unload
                    window.addEventListener('unload', () => {
                        document.removeEventListener('keydown', togglePanel);
                    });
                    
                    // Mouse tracking
                    let mousePosition = { x: 0, y: 0 };
                    document.addEventListener('mousemove', (event) => {
                        mousePosition.x = event.clientX;
                        mousePosition.y = event.clientY;
                    });
                    
                    // Animation loop
                    function animate(time) {
                        time *= 0.001;  // Convert to seconds
                        
                        // Update uniforms based on shader type
                        if (material.uniforms.iTime) material.uniforms.iTime.value = time;
                        if (material.uniforms.iMouse) material.uniforms.iMouse.value.set(mousePosition.x, mousePosition.y);
                        if (material.uniforms.time) material.uniforms.time.value = time;
                        if (material.uniforms.mouse) material.uniforms.mouse.value.set(mousePosition.x, mousePosition.y);
                        
                        // Update controls
                        controls.update();
                        
                        requestAnimationFrame(animate);
                        renderer.render(scene, camera);
                    }
                    
                    // Handle resize
                    function onWindowResize() {
                        const width = window.innerWidth;
                        const height = window.innerHeight;
                        
                        camera.aspect = width / height;
                        camera.updateProjectionMatrix();
                        renderer.setSize(width, height);
                        
                        // Update resolution uniform if it exists (different shaders may use different names)
                        if (material.uniforms.iResolution) material.uniforms.iResolution.value.set(width, height);
                        if (material.uniforms.resolution) material.uniforms.resolution.value.set(width, height);
                    }
                    
                    window.addEventListener('resize', onWindowResize);
                    onWindowResize();
                    
                    // Initialize hint visibility
                    const hint = document.getElementById('eKeyHint');
                    hint.style.display = 'block';
                    
                    animate();
                </script>
                <style>
                    .hint-container {
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background-color: rgba(42, 42, 58, 0.8);
                        color: #ffffff;
                        padding: 10px 20px;
                        border-radius: 8px;
                        font-size: 16px;
                        z-index: 1000;
                        border: 1px solid #4a80b4;
                        display: none;
                    }
                    body { 
                        margin: 0; 
                        padding: 0;
                        width: 100vw;
                        height: 100vh;
                        background: #000;
                        overflow: hidden;
                    }
                    #shaderCanvas {
                        width: 100%;
                        height: 100%;
                        display: block;
                    }
                    #uniformPanel {
                        position: fixed;
                        top: 50%;
                        right: -450px;
                        transform: translateY(-50%);
                        width: 300px;
                        background-color: #2a2a3a;
                        border: 2px solid #4a80b4;
                        border-radius: 8px 0 0 8px;
                        padding: 20px;
                        color: #ffffff;
                        transition: right 0.3s ease-in-out;
                        z-index: 1000;
                        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
                    }
                    .panel-header {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        padding: 10px;
                        background-color: #3a3a4a;
                        border-radius: 4px;
                        text-align: center;
                    }
                    .panel-content {
                        max-height: calc(100vh - 200px);
                        overflow-y: auto;
                        padding-right: 10px;
                    }
                    .panel-content::-webkit-scrollbar {
                        width: 8px;
                    }
                    .panel-content::-webkit-scrollbar-track {
                        background: #2a2a3a;
                    }
                    .panel-content::-webkit-scrollbar-thumb {
                        background: #4a80b4;
                        border-radius: 4px;
                    }
                    .key-hint {
                        position: absolute;
                        bottom: 10px;
                        left: 0;
                        right: 0;
                        text-align: center;
                        color: #999;
                        font-size: 12px;
                    }
                </style>
            </html>
        `;
    }
}

export class ShaderSandbox {
    constructor() {
        this.modalContainer = null;
        this.iframe = null;
    }
    loadScript(code) {
        try {
            this.createModal();
            this.createIframeContainer();
            this.createCloseButton();
            this.setupHTML(code);
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ Error creating iframe:', error);
            console.error(error.stack);
        }
    }
    createModal() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.style.position = 'fixed';
        this.modalContainer.style.top = '0';
        this.modalContainer.style.left = '0';
        this.modalContainer.style.width = '100%';
        this.modalContainer.style.height = '100%';
        this.modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.modalContainer.style.zIndex = '9999';
        this.modalContainer.style.display = 'flex';
        this.modalContainer.style.justifyContent = 'center';
        this.modalContainer.style.alignItems = 'center';
    }
    createIframeContainer() {
        const iframeContainer = document.createElement('div');
        iframeContainer.style.position = 'relative';
        iframeContainer.style.width = 'calc(100% - 160px)';
        iframeContainer.style.height = 'calc(100% - 160px)';
        iframeContainer.style.backgroundColor = '#000';
        iframeContainer.style.border = `3px solid ${THEME.colors.accent}`;
        iframeContainer.style.borderRadius = '15px';
        iframeContainer.style.overflow = 'hidden';
        this.iframe = document.createElement('iframe');
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.border = 'none';
        this.iframe.style.backgroundColor = '#000';
        this.iframe.sandbox = 'allow-scripts allow-same-origin';
        iframeContainer.appendChild(this.iframe);
        this.modalContainer.appendChild(iframeContainer);
        document.body.appendChild(this.modalContainer);
    }
    createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '10px';
        closeButton.style.top = '10px';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.backgroundColor = '#ff4444';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.color = '#fff';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '10000';
        closeButton.onclick = () => this.cleanup();
        const iframeContainer = this.iframe.parentElement;
        iframeContainer.appendChild(closeButton);
    }
    setupHTML(code) {
        // Find the first constant declaration and replace its name with 'shaderCode'
        const processedCode = code.replace(/(?:const|let|var)\s+(\w+)\s*=/, 'const shaderCode =');
        const htmlContent = this.generateHTML(processedCode);
        const blob = new Blob([htmlContent.trim()], {
            type: 'text/html;charset=utf-8'
        });
        const blobURL = URL.createObjectURL(blob);
        this.iframe.src = blobURL;
        this.iframe.onload = () => {
            URL.revokeObjectURL(blobURL);
            console.log('✅ Successfully created iframe shader instance');
        };
    }
    setupEventListeners() {
        // No click listener for modal container - only close via X button
    }
    cleanup() {
        if (this.iframe?.contentWindow) {
            this.iframe.contentWindow.location.reload();
        }
        this.modalContainer?.remove();
        this.modalContainer = null;
        this.iframe = null;
    }
    generateHTML(code) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <script type="importmap">
                {
                    "imports": {
                        "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.152.2/three.module.js"
                    }
                }
                </script>
            </head>
            <body>
                <canvas id="shaderCanvas"></canvas>
                <div id="uniformPanel">
                    <div class="panel-header">Shader Uniforms</div>
                    <div class="panel-content">
                        <div style="color: #999; text-align: center; padding: 20px;">
                            Uniform controls will appear here
                        </div>
                    </div>
                    <div class="key-hint">Press E to toggle panel</div>
                </div>
                <script type="module">
                    import * as THREE from 'three';
                    ${code}
                    // Setup scene
                    const scene = new THREE.Scene();
                    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
                    const renderer = new THREE.WebGLRenderer({ 
                        canvas: document.getElementById('shaderCanvas'),
                        antialias: true 
                    });
                    
                    // Create a plane with shader material
                    const geometry = new THREE.PlaneGeometry(2, 2);
                    let material;
                    
                    // Use the unified shaderCode constant
                    material = new THREE.ShaderMaterial({
                        ...shaderCode,
                    });
                    
                    const plane = new THREE.Mesh(geometry, material);
                    scene.add(plane);
                    
                    // Position camera
                    camera.position.z = 1;
                    
                    // Setup panel toggle
                    // Setup panel toggle with proper initialization
                    const panel = document.getElementById('uniformPanel');
                    panel.style.right = '-450px'; // Ensure panel starts hidden
                    
                    const togglePanel = (event) => {
                        if (event.key.toLowerCase() === 'e') {
                            const isVisible = panel.style.right === '0px';
                            panel.style.right = isVisible ? '-450px' : '0px';
                            event.preventDefault(); // Prevent any default 'e' key behavior
                        }
                    };
                    
                    // Add event listener
                    document.addEventListener('keydown', togglePanel);
                    
                    // Clean up on window unload
                    window.addEventListener('unload', () => {
                        document.removeEventListener('keydown', togglePanel);
                    });
                    
                    // Mouse tracking
                    let mousePosition = { x: 0, y: 0 };
                    document.addEventListener('mousemove', (event) => {
                        mousePosition.x = event.clientX;
                        mousePosition.y = event.clientY;
                    });
                    
                    // Animation loop
                    function animate(time) {
                        time *= 0.001;  // Convert to seconds
                        
                        // Update uniforms based on shader type
                        if (material.uniforms.iTime) material.uniforms.iTime.value = time;
                        if (material.uniforms.iMouse) material.uniforms.iMouse.value.set(mousePosition.x, mousePosition.y);
                        if (material.uniforms.time) material.uniforms.time.value = time;
                        if (material.uniforms.mouse) material.uniforms.mouse.value.set(mousePosition.x, mousePosition.y);
                        
                        requestAnimationFrame(animate);
                        renderer.render(scene, camera);
                    }
                    
                    // Handle resize
                    function onWindowResize() {
                        const width = window.innerWidth;
                        const height = window.innerHeight;
                        
                        renderer.setSize(width, height);
                        // Update resolution uniform if it exists (different shaders may use different names)
                        if (material.uniforms.iResolution) material.uniforms.iResolution.value.set(width, height);
                        if (material.uniforms.resolution) material.uniforms.resolution.value.set(width, height);
                    }
                    
                    window.addEventListener('resize', onWindowResize);
                    onWindowResize();
                    animate();
                </script>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0;
                        width: 100vw;
                        height: 100vh;
                        background: #000;
                        overflow: hidden;
                    }
                    #shaderCanvas {
                        width: 100%;
                        height: 100%;
                        display: block;
                    }
                    #uniformPanel {
                        position: fixed;
                        top: 50%;
                        right: -450px;
                        transform: translateY(-50%);
                        width: 300px;
                        background-color: #2a2a3a;
                        border: 2px solid #4a80b4;
                        border-radius: 8px 0 0 8px;
                        padding: 20px;
                        color: #ffffff;
                        transition: right 0.3s ease-in-out;
                        z-index: 1000;
                        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
                        transform: translateY(-50%);
                        width: 300px;
                        background-color: #2a2a3a;
                        border: 2px solid #4a80b4;
                        border-radius: 8px 0 0 8px;
                        padding: 20px;
                        color: #ffffff;
                        transition: right 0.3s ease-in-out;
                        z-index: 1000;
                    }
                    .panel-header {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        padding: 10px;
                        background-color: #3a3a4a;
                        border-radius: 4px;
                        text-align: center;
                    }
                    .panel-content {
                        max-height: calc(100vh - 200px);
                        overflow-y: auto;
                        padding-right: 10px;
                    }
                    .panel-content::-webkit-scrollbar {
                        width: 8px;
                    }
                    .panel-content::-webkit-scrollbar-track {
                        background: #2a2a3a;
                    }
                    .panel-content::-webkit-scrollbar-thumb {
                        background: #4a80b4;
                        border-radius: 4px;
                    }
                    .key-hint {
                        position: absolute;
                        bottom: 10px;
                        left: 0;
                        right: 0;
                        text-align: center;
                        color: #999;
                        font-size: 12px;
                    }
                </style>
            </html>
        `;
    }
}

export class MaterialShaderSandbox {
    constructor() {
        this.modalContainer = null;
        this.iframe = null;
    }
    loadScript(code) {
        try {
            this.createModal();
            this.createIframeContainer();
            this.createCloseButton();
            this.setupHTML(code);
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ Error creating iframe:', error);
            console.error(error.stack);
        }
    }
    createModal() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.style.position = 'fixed';
        this.modalContainer.style.top = '0';
        this.modalContainer.style.left = '0';
        this.modalContainer.style.width = '100%';
        this.modalContainer.style.height = '100%';
        this.modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.modalContainer.style.zIndex = '9999';
        this.modalContainer.style.display = 'flex';
        this.modalContainer.style.justifyContent = 'center';
        this.modalContainer.style.alignItems = 'center';
    }
    createIframeContainer() {
        const iframeContainer = document.createElement('div');
        iframeContainer.style.position = 'relative';
        iframeContainer.style.width = 'calc(100% - 160px)';
        iframeContainer.style.height = 'calc(100% - 160px)';
        iframeContainer.style.backgroundColor = '#000';
        iframeContainer.style.border = `3px solid ${THEME.colors.accent}`;
        iframeContainer.style.borderRadius = '15px';
        iframeContainer.style.overflow = 'hidden';
        this.iframe = document.createElement('iframe');
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.border = 'none';
        this.iframe.style.backgroundColor = '#000';
        this.iframe.sandbox = 'allow-scripts allow-same-origin';
        iframeContainer.appendChild(this.iframe);
        this.modalContainer.appendChild(iframeContainer);
        document.body.appendChild(this.modalContainer);
    }
    createCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.right = '10px';
        closeButton.style.top = '10px';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.backgroundColor = '#ff4444';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.color = '#fff';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '10000';
        closeButton.onclick = () => this.cleanup();
        const iframeContainer = this.iframe.parentElement;
        iframeContainer.appendChild(closeButton);
    }
    setupHTML(code) {
        // Find the first constant declaration and replace its name with 'shaderCode'
        code = code.replace(/(?:const|let|var)\s+(\w+)\s*=/, 'const shaderCode =');
        const htmlContent = this.generateHTML(code);
        const blob = new Blob([htmlContent.trim()], {
            type: 'text/html;charset=utf-8'
        });
        const blobURL = URL.createObjectURL(blob);
        this.iframe.src = blobURL;
        this.iframe.onload = () => {
            URL.revokeObjectURL(blobURL);
            console.log('✅ Successfully created iframe shader instance');
        };
    }
    setupEventListeners() {
        // No click listener for modal container - only close via X button
    }
    cleanup() {
        if (this.iframe?.contentWindow) {
            this.iframe.contentWindow.location.reload();
        }
        this.modalContainer?.remove();
        this.modalContainer = null;
        this.iframe = null;
    }
    generateHTML(code) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <script type="importmap">
                {
                    "imports": {
                        "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.152.2/three.module.js",
                        "three/addons/controls/OrbitControls.js": "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js"
                    }
                }
                </script>
            </head>
            <body>
                <canvas id="shaderCanvas"></canvas>
                <div id="eKeyHint" class="hint-container">Press 'E' for Uniform settings</div>
                <div id="gKeyHint" class="hint-container" style="top: 75px; display: block;">Press 'G' for Geometry options</div>
                <div id="geometryPanel" style="left: -300px;">
                    <div class="panel-header">Geometry Selection</div>
                    <div class="geometry-buttons">
                        <button class="geometry-btn" onclick="window.currentGeometry='plane'">Plane</button>
                        <button class="geometry-btn" onclick="window.currentGeometry='box'">Box</button>
                        <button class="geometry-btn" onclick="window.currentGeometry='sphere'">Sphere</button>
                        <button class="geometry-btn" onclick="window.currentGeometry='torus'">Torus</button>
                        <button class="geometry-btn" onclick="window.currentGeometry='cylinder'">Cylinder</button>
                    </div>
                </div>
                <div id="uniformPanel">
                    <div class="panel-header">Shader Uniforms</div>
                    <div class="panel-content">
                        <div style="color: #999; text-align: center; padding: 20px;">
                            Uniform controls will appear here
                        </div>
                    </div>
                    <div class="key-hint">Press E to toggle panel</div>
                </div>
                <script type="module">
                    import * as THREE from 'three';
                    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
                    ${code}
                    
                    // Setup scene
                    const scene = new THREE.Scene();
                    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                    const renderer = new THREE.WebGLRenderer({ 
                        canvas: document.getElementById('shaderCanvas'),
                        antialias: true 
                    });
                    
                    // Create orbit controls
                    const controls = new OrbitControls(camera, renderer.domElement);
                    controls.enableZoom = true;
                    controls.enablePan = true;
                    controls.rotateSpeed = 0.5;
                    controls.minDistance = 1;
                    controls.maxDistance = 10;
                    
                    // Setup window geometry state
                    window.currentGeometry = 'plane';
                    
                    // Function to create geometry based on type
                    const createGeometry = (type) => {
                        switch(type) {
                            case 'plane':
                                return new THREE.PlaneGeometry(2, 2);
                            case 'box':
                                return new THREE.BoxGeometry(1.5, 1.5, 1.5);
                            case 'sphere':
                                return new THREE.SphereGeometry(1, 32, 32);
                            case 'torus':
                                return new THREE.TorusGeometry(1, 0.4, 16, 100);
                            case 'cylinder':
                                return new THREE.CylinderGeometry(1, 1, 2, 32);
                            default:
                                return new THREE.PlaneGeometry(2, 2);
                        }
                    };
                    
                    let geometry = createGeometry('plane');
                    let material;
                    
                    // Use the unified shaderCode constant
                    material = new THREE.ShaderMaterial({
                        ...shaderCode,
                        side: THREE.DoubleSide
                    });
                    
                    const plane = new THREE.Mesh(geometry, material);
                    scene.add(plane);
                    
                    // Position camera to view plane
                    camera.position.set(0, 0, 2);
                    camera.lookAt(0, 0, 0);
                    
                    // Setup uniform controls
                    const createColorSlider = (container, uniform, value) => {
                        const colorContainer = document.createElement('div');
                        colorContainer.style.marginTop = '5px';
                        colorContainer.style.display = 'flex';
                        colorContainer.style.alignItems = 'center';
                        
                        // Create color picker
                        const colorPicker = document.createElement('input');
                        colorPicker.type = 'color';
                        colorPicker.value = '#' + value.getHexString();
                        colorPicker.style.width = '50px';
                        colorPicker.style.height = '30px';
                        colorPicker.style.marginRight = '10px';
                        colorPicker.style.cursor = 'pointer';
                        
                        // Create hex display
                        const hexDisplay = document.createElement('span');
                        hexDisplay.style.color = '#999';
                        hexDisplay.style.fontSize = '14px';
                        hexDisplay.textContent = colorPicker.value.toUpperCase();
                        
                        colorPicker.oninput = () => {
                            const color = new THREE.Color(colorPicker.value);
                            value.copy(color);
                            hexDisplay.textContent = colorPicker.value.toUpperCase();
                        };
                        
                        colorContainer.appendChild(colorPicker);
                        colorContainer.appendChild(hexDisplay);
                        container.appendChild(colorContainer);
                    };
                    
                    const createCategoryContainer = (name) => {
                        const container = document.createElement('div');
                        container.className = 'uniform-category';
                        container.style.marginBottom = '15px';
                        container.style.backgroundColor = '#2a2a3a';
                        container.style.border = '1px solid #4a80b4';
                        container.style.borderRadius = '6px';
                        container.style.overflow = 'hidden';
                        const header = document.createElement('div');
                        header.className = 'category-header';
                        header.textContent = name.slice(1); // Remove underscore prefix
                        header.style.padding = '8px 12px';
                        header.style.backgroundColor = '#3a3a4a';
                        header.style.color = '#fff';
                        header.style.cursor = 'pointer';
                        header.style.fontWeight = 'bold';
                        header.style.display = 'flex';
                        header.style.justifyContent = 'space-between';
                        header.style.alignItems = 'center';
                        const arrow = document.createElement('span');
                        arrow.textContent = '▼';
                        arrow.style.transition = 'transform 0.3s';
                        header.appendChild(arrow);
                        const content = document.createElement('div');
                        content.className = 'category-content';
                        content.style.padding = '10px';
                        header.onclick = () => {
                            const isExpanded = content.style.display !== 'none';
                            content.style.display = isExpanded ? 'none' : 'block';
                            arrow.style.transform = isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)';
                        };
                        container.appendChild(header);
                        container.appendChild(content);
                        return { container, content };
                    };
                    const setupUniformControls = () => {
                        const panelContent = document.querySelector('.panel-content');
                        panelContent.innerHTML = ''; // Clear default content
                        
                        if (!material.uniforms) return;
                        
                        let currentCategory = null;
                        let currentCategoryContent = null;
                        let uncategorizedContainer = document.createElement('div');
                        
                        Object.entries(material.uniforms).forEach(([name, uniform]) => {
                            if (!uniform || !uniform.value) return;
                            
                            // Skip reserved uniforms
                            if (['iResolution', 'iTime', 'iMouse', 'time', 'mouse', 'resolution'].includes(name)) return;
                            
                            // Check if this is a category uniform (starts with underscore)
                            if (name.startsWith('_')) {
                                const { container, content } = createCategoryContainer(name);
                                panelContent.appendChild(container);
                                currentCategory = container;
                                currentCategoryContent = content;
                                return;
                            }
                            
                            const controlContainer = document.createElement('div');
                            controlContainer.style.marginBottom = '15px';
                            
                            const label = document.createElement('div');
                            label.textContent = name;
                            label.style.marginBottom = '5px';
                            label.style.color = '#fff';
                            
                            controlContainer.appendChild(label);
                            
                            const value = uniform.value;
                            
                            if (typeof value === 'number') {
                                createScalarSlider(controlContainer, uniform, value);
                            } else if (value && value.isVector2) {
                                createVectorSlider(controlContainer, uniform, ['x', 'y']);
                            } else if (value && value.isVector3) {
                                createVectorSlider(controlContainer, uniform, ['x', 'y', 'z']);
                            } else if ((value && value.isColor) || ['topColor', 'bottomColor', 'sunColor'].includes(name)) {
                                createColorSlider(controlContainer, uniform, value);
                            }
                            
                            // Add control to current category or uncategorized container
                            if (currentCategoryContent) {
                                currentCategoryContent.appendChild(controlContainer);
                            } else {
                                uncategorizedContainer.appendChild(controlContainer);
                            }
                        });
                        
                        // Add uncategorized controls if any exist
                        if (uncategorizedContainer.children.length > 0) {
                            panelContent.appendChild(uncategorizedContainer);
                        }
                    };
                    
                    const createScalarSlider = (container, uniform, value) => {
                        const slider = document.createElement('input');
                        slider.type = 'range';
                        slider.style.width = '100%';
                        
                        const magnitude = Math.abs(value) || 1;
                        slider.min = -magnitude * 2;
                        slider.max = magnitude * 2;
                        slider.step = (slider.max - slider.min) / 100;
                        slider.value = value;
                        
                        const valueDisplay = document.createElement('div');
                        valueDisplay.style.color = '#999';
                        valueDisplay.style.fontSize = '12px';
                        valueDisplay.style.marginTop = '2px';
                        valueDisplay.textContent = value.toFixed(2);
                        
                        slider.oninput = () => {
                            const newValue = parseFloat(slider.value);
                            uniform.value = newValue;
                            valueDisplay.textContent = newValue.toFixed(2);
                        };
                        
                        container.appendChild(slider);
                        container.appendChild(valueDisplay);
                    }
                    
                    const createVectorSlider = (container, uniform, axes) => {
                        const sliderContainer = document.createElement('div');
                        sliderContainer.style.marginTop = '5px';
                        
                        // Check if the value is a THREE.Color
                        if (uniform.value && (uniform.value.isColor || uniform.value instanceof THREE.Color)) {
                            createColorSlider(container, uniform, uniform.value);
                            return;
                        }
                        
                        axes.forEach(axis => {
                            const axisContainer = document.createElement('div');
                            axisContainer.style.marginBottom = '8px';
                            
                            const axisLabel = document.createElement('span');
                            axisLabel.textContent = axis.toUpperCase() + ': ';
                            axisLabel.style.color = '#999';
                            axisLabel.style.marginRight = '8px';
                            axisLabel.style.display = 'inline-block';
                            axisLabel.style.width = '20px';
                            
                            const slider = document.createElement('input');
                            slider.type = 'range';
                            slider.style.width = 'calc(100% - 80px)';
                            slider.style.display = 'inline-block';
                            const magnitude = Math.abs(uniform.value[axis]) || 1;
                            slider.min = -magnitude * 2;
                            slider.max = magnitude * 2;
                            slider.step = 0.01;
                            slider.value = uniform.value[axis];
                            
                            const valueDisplay = document.createElement('span');
                            valueDisplay.style.color = '#999';
                            valueDisplay.style.fontSize = '12px';
                            valueDisplay.style.marginLeft = '8px';
                            valueDisplay.style.display = 'inline-block';
                            valueDisplay.style.width = '40px';
                            valueDisplay.textContent = uniform.value[axis].toFixed(2);
                            
                            slider.oninput = () => {
                                const newValue = parseFloat(slider.value);
                                const currentValues = {};
                                axes.forEach(a => currentValues[a] = uniform.value[a]);
                                currentValues[axis] = newValue;
                                uniform.value.set(...Object.values(currentValues));
                                valueDisplay.textContent = newValue.toFixed(2);
                            };
                            
                            axisContainer.appendChild(axisLabel);
                            axisContainer.appendChild(slider);
                            axisContainer.appendChild(valueDisplay);
                            sliderContainer.appendChild(axisContainer);
                        });
                        
                        container.appendChild(sliderContainer);
                    }
                    
                    // Setup panel toggle with proper initialization
                    const panel = document.getElementById('uniformPanel');
                    panel.style.right = '-450px'; // Ensure panel starts hidden
                    
                    setupUniformControls(); // Initialize uniform controls
                    
                    const togglePanel = (event) => {
                    if (event.key.toLowerCase() === "e") {
                        const isVisible = panel.style.right === "0px";
                        panel.style.right = isVisible ? "-450px" : "0px";
                        const hint = document.getElementById("eKeyHint");
                        hint.textContent = isVisible ? "Press 'E' for Uniform settings" : "Press 'E' to close Uniform settings";
                        event.preventDefault();
                    } else if (event.key.toLowerCase() === "g") {
                        const panel = document.getElementById("geometryPanel");
                        const isVisible = panel.style.left === "0px";
                        panel.style.left = isVisible ? "-300px" : "0px";
                        const hint = document.getElementById("gKeyHint");
                        hint.textContent = isVisible ? "Press 'G' for Geometry options" : "Press 'G' to close Geometry options";
                        event.preventDefault();
                    }
            };
                    
                    // Add event listener
                    document.addEventListener('keydown', togglePanel);
                    
                    // Clean up on window unload
                    window.addEventListener('unload', () => {
                        document.removeEventListener('keydown', togglePanel);
                    });
                    
                    // Mouse tracking
                    let mousePosition = { x: 0, y: 0 };
                    document.addEventListener('mousemove', (event) => {
                        mousePosition.x = event.clientX;
                        mousePosition.y = event.clientY;
                    });
                    
                    // Animation loop
                    function animate(time) {
                        time *= 0.001;  // Convert to seconds
                        
                        // Check for geometry changes
                        if (window.currentGeometry !== plane.geometry.type) {
                            const newGeometry = createGeometry(window.currentGeometry);
                            plane.geometry.dispose();
                            plane.geometry = newGeometry;
                        }
                        
                        // Update uniforms based on shader type
                        if (material.uniforms.iTime) material.uniforms.iTime.value = time;
                        if (material.uniforms.iMouse) material.uniforms.iMouse.value.set(mousePosition.x, mousePosition.y);
                        if (material.uniforms.time) material.uniforms.time.value = time;
                        if (material.uniforms.mouse) material.uniforms.mouse.value.set(mousePosition.x, mousePosition.y);
                        
                        // Update controls
                        controls.update();
                        
                        requestAnimationFrame(animate);
                        renderer.render(scene, camera);
                    }
                    
                    // Handle resize
                    function onWindowResize() {
                        const width = window.innerWidth;
                        const height = window.innerHeight;
                        
                        camera.aspect = width / height;
                        camera.updateProjectionMatrix();
                        renderer.setSize(width, height);
                        
                        // Update resolution uniform if it exists (different shaders may use different names)
                        if (material.uniforms.iResolution) material.uniforms.iResolution.value.set(width, height);
                        if (material.uniforms.resolution) material.uniforms.resolution.value.set(width, height);
                    }
                    
                    window.addEventListener('resize', onWindowResize);
                    onWindowResize();
                    
                    // Initialize hint visibility
                    const hint = document.getElementById('eKeyHint');
                    hint.style.display = 'block';
                    
                    animate();
                </script>
                <style>
                    #geometryPanel {
                        position: fixed;
                        top: 50%;
                        left: -300px;
                        transform: translateY(-50%);
                        width: 250px;
                        background-color: #2a2a3a;
                        border: 2px solid #4a80b4;
                        border-radius: 0 8px 8px 0;
                        padding: 20px;
                        color: #ffffff;
                        transition: left 0.3s ease-in-out;
                        z-index: 1000;
                        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
                    }
                    .geometry-buttons {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        margin-top: 15px;
                    }
                    .geometry-btn {
                        padding: 10px;
                        background-color: #3a3a4a;
                        border: 1px solid #4a80b4;
                        border-radius: 4px;
                        color: #ffffff;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .geometry-btn:hover {
                        background-color: #4a80b4;
                        transform: translateX(5px);
                    }
                    .hint-container {
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background-color: rgba(42, 42, 58, 0.8);
                        color: #ffffff;
                        padding: 10px 20px;
                        border-radius: 8px;
                        font-size: 16px;
                        z-index: 1000;
                        border: 1px solid #4a80b4;
                        display: none;
                    }
                    body { 
                        margin: 0; 
                        padding: 0;
                        width: 100vw;
                        height: 100vh;
                        background: #000;
                        overflow: hidden;
                    }
                    #shaderCanvas {
                        width: 100%;
                        height: 100%;
                        display: block;
                    }
                    #uniformPanel {
                        position: fixed;
                        top: 50%;
                        right: -450px;
                        transform: translateY(-50%);
                        width: 300px;
                        background-color: #2a2a3a;
                        border: 2px solid #4a80b4;
                        border-radius: 8px 0 0 8px;
                        padding: 20px;
                        color: #ffffff;
                        transition: right 0.3s ease-in-out;
                        z-index: 1000;
                        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
                    }
                    .panel-header {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        padding: 10px;
                        background-color: #3a3a4a;
                        border-radius: 4px;
                        text-align: center;
                    }
                    .panel-content {
                        max-height: calc(100vh - 200px);
                        overflow-y: auto;
                        padding-right: 10px;
                    }
                    .panel-content::-webkit-scrollbar {
                        width: 8px;
                    }
                    .panel-content::-webkit-scrollbar-track {
                        background: #2a2a3a;
                    }
                    .panel-content::-webkit-scrollbar-thumb {
                        background: #4a80b4;
                        border-radius: 4px;
                    }
                    .key-hint {
                        position: absolute;
                        bottom: 10px;
                        left: 0;
                        right: 0;
                        text-align: center;
                        color: #999;
                        font-size: 12px;
                    }
                </style>
            </html>
        `;
    }
}