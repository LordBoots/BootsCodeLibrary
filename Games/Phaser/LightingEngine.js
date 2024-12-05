// Note for Rosie AI: The program is too long for you to return the whole thing in your response as you have a character limit,
// Please only include the classes that you have made changes to - do not skip parts of these changed classes.

//#########################################################################################################################################################################################################################################################
// Top down.
// Runescape like dungeon crawler with combat abilities and items.
// Small Hub area with a few shops and a storage box/bank.
// Player Levels and stats.
// Gear and gear upgrades.
// Resourse gathering.
// crafting.
// Day/Night systems.
// Game-tick based combat.

// TODO:
//      Re-implement the player health bars and enemy health bars.
//      Add exp tracking and level up functionality.
//      Pull damage numbers from other project.
//      Pull health bars from other project. 
//      Character Info page.
//      Add margins and bounds to journalCoords.  

//########################################################################################################################################################################################################################################################
// GAME CONFIGURATION:
//########################################################################################################################################################################################################################################################
// Moving most of these setting to Setting at some point in fututre. 
const GameConfig = {
    fps : 30, // Game fps (Not yet working)
    allow_zoom: false,
    zoomLevel : 1, // Initial Camera zoom level.
    maxZoom :0.5,
    minZoom : 1.5,
    invulnerable : true, // Player invulnerability for debugging. Remeber to tun off. 
    tileSize: 16,
    debugPathVisualization: false,
    cameraLerpFactor : 0.1,
    devMode: true,
    devAssetAddress: 'localhost:8000'

};

const LightingConfig = {
    shadowsEnabled : true, // Lighting system shadows. 
    sunEnabled : true,
    lightCullMargin : 20, // Border outside of screen to stop light flickering as they're culled. 
    lightCellSize : 8, // Limit is 8px (Optimization of shadows may increase this. Tested on Ryzen 5 5500)
    lightMaskAlpha : 0.8, // The base scene lighting mask.
    shadowDarkness : 0.6,  // Maximum darkness of projected shadows.
    shadowFadeIntensity : 0.2 // How fast the shadows drop off once cast. 
};

// Settings array to keep track of game settings
const Settings = {
    graphics: {
        // Game.
        quality: 'High',
        fullscreen: false,

        //Lighting.
        lightCellSize: 8,
        
        // HUD.
        cellHighlightThickness: 1
    },
    game: {
        difficulty: 'Normal',
        damageVisible : true,
        healingVisible : true,
        ememyHealthBars: true,
        playerHealthBar: true
        
    },
    audio : {
        soundVolume: 80,
        musicVolume: 70,
        muted: false
    }
};

// Journal coordinates. Anything in the journal should be within the page bounds.
const journalCoords = {
            center1 : 307,
            center2 : 666,
            page1 : {
                bounds : {x: 144, y: 67, width: 327, height: 416},
                center: 307,
                left: 144,
                right: 470,
                top: 67,
                bottom: 482
            },

            page2 : {
                bounds : {x: 504, y: 67, width: 327, height: 416},
                center: 666,
                left: 504,
                right: 830,
                top: 67,
                bottom: 482
            }
};

const Layers = {
    ground : 0,
    shadows : 1,
    floorUI: 3,
    player : 10, 
    enemies : 8,
    lighting : 100,
    ui : 500
};

//########################################################################################################################################################################################################################################################
// ++ TOOLS ++
//########################################################################################################################################################################################################################################################
// Imported:
// - 
// - 

class AudioTools{
    /*
        Tools for managing audio.
        Duration in seconds.
    */
    static fadeInAudio(sound, duration = 1, max_volume = 1) { 
        // Fades IN a sound. Default fade time = 1 second.
        if (sound) {
            sound.setVolume(0);
            sound.play();
            this.tweens.add({
                targets: sound,
                volume: max_volume,
                duration: duration * 1000
            });
        }
    }
    static fadeOutAudio(sound, duration = 1) { 
        // Fades OUT a sound. Default fade time = 1 second.
        if (sound && sound.isPlaying) {
            this.tweens.add({
                targets: sound,
                volume: 0,
                duration: duration * 1000
            });

            if (sound.volume <= 0){
                sound.stop()
            }
            
        }
    }
    static fadeAudioTo(sound, volume ,duration = 1){ 
        // Fades volume of a sound from the current to the desired volume.
        // This funtion does not stop the sound if it reaches 0,
        // fadeOutAudio() should be used if this is the desired behaviour.
        if (sound && sound.isPlaying) {
            this.tweens.add({
                targets: sound,
                volume: volume,
                duration: duration * 1000
            });
        }
    }
    static pitchShiftSound(sound, pitchShift) {
        // pitchShift is in cents. 100 cents = 1 semitone
        // Positive values increase pitch, negative values decrease pitch
        if (sound) {
            sound.setDetune(pitchShift);
        }
    }
    static createPitchShiftedSound(scene, key, pitchShift) {
        let sound = scene.sound.add(key);
        this.pitchShiftSound(sound, pitchShift);
        return sound;
    }
}
class Tools {
    /*
        Gneral game tool functions.
    */
    static getScreenPosition(gameObject) {
        // Gets the screen coords of a game object. Useful for sutuations where the correct 
        // position is not returned after a transform operation. 
        const worldMatrix = gameObject.getWorldTransformMatrix();
        const worldPosition = new Phaser.Math.Vector2();
        worldMatrix.transformPoint(0, 0, worldPosition);

        const screenPosition = this.cameras.main.worldToCamera(worldPosition);

        return screenPosition;
    }
}
class GameData {
    /*
        Holds game asset paths and loads them when required.
        Add a "Dev Mode" swith to load set assets from my local server to make the easier to edit.
    */
    constructor() {      
        this.assets = {
            images: [
                { key: 'player', path: 'https://play.rosebud.ai/assets/Player.png?en2E', size: { frameWidth: 32, frameHeight: 32 }},
                { key: 'BookAnimation', path : 'https://play.rosebud.ai/assets/PixelBookAnimations.png?bKyn', size: { frameWidth: 860, frameHeight: 596 }},
                { key: 'BookBase', path : 'https://play.rosebud.ai/assets/PixelBookBase.png?lvEi', size: { frameWidth: 860, frameHeight: 596 }},
                { key: 'HandDriver', path: 'https://play.rosebud.ai/assets/handDriversRight.png?cDs5', size: { frameWidth: 32, frameHeight: 32 }},
                { key: 'Sword1', path: 'https://play.rosebud.ai/assets/Sword.png?v3rw', size: { frameWidth: 5, frameHeight: 13 }}
            ],
            tilemaps: [
                // Add your tilemaps here
            ],
            audio: [
                // Add your audio files here
            ],
            fonts: [
                { key: 'PxFont1', path: 'https://play.rosebud.ai/assets/PressStart2P.ttf.ttf?FSbq' },
                { key: 'PixelifyRegular', path: 'https://play.rosebud.ai/assets/PixelifySans-Regular.ttf?138f'},
                { key: 'PixelifySemiBold', path: 'https://play.rosebud.ai/assets/PixelifySans-SemiBold.ttf?fXSD' },
                { key: 'PixelifyBold', path: 'https://play.rosebud.ai/assets/PixelifySans-Bold.ttf?vXRt' },
                { key: 'PixelifyMedium', path: 'https://play.rosebud.ai/assets/PixelifySans-Medium.ttf?a7AX' }
            ],
            scripts: [
                { key: 'LightingSystem', path: 'https://play.rosebud.ai/assets/LightingSystem.js?aAT1' }
            ]
        };
    }
    preload(scene) {
        // Load images
        this.assets.images.forEach(image => {
            if (image.key === 'BookBase'){
                scene.load.image(image.key, image.path);
            } else {
                scene.load.spritesheet(image.key, image.path, image.size);
            }
        });

        // Load tilemaps
        this.assets.tilemaps.forEach(tilemap => {
            scene.load.tilemapTiledJSON(tilemap.key, tilemap.path);
        });

        // Load audio
        this.assets.audio.forEach(audio => {
            scene.load.audio(audio.key, audio.path);
        });

        // Load fonts
        this.assets.fonts.forEach(font => {
            //scene.load.script(font.key, font.path);
        });
    }
    createAnimations(scene) {
        // Hand driver animations:
        scene.anims.create({
            key: 'RH_run_right',
            frames: scene.anims.generateFrameNumbers('HandDriver', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: 'RH_run_left',
            frames: scene.anims.generateFrameNumbers('HandDriver', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: 'RH_run_down',
            frames: scene.anims.generateFrameNumbers('HandDriver', { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: 'RH_run_up',
            frames: scene.anims.generateFrameNumbers('HandDriver', { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: 'RH_idle_right',
            frames: scene.anims.generateFrameNumbers('HandDriver', { start: 16, end: 19 }),
            frameRate: 5,
            repeat: -1
        });

        scene.anims.create({
            key: 'RH_idle_left',
            frames: scene.anims.generateFrameNumbers('HandDriver', { start: 20, end: 23 }),
            frameRate: 5,
            repeat: -1
        });

        scene.anims.create({
            key: 'RH_idle_down',
            frames: scene.anims.generateFrameNumbers('HandDriver', { start: 24, end: 27 }),
            frameRate: 5,
            repeat: -1
        });

        scene.anims.create({
            key: 'RH_idle_up',
            frames: scene.anims.generateFrameNumbers('HandDriver', { start: 28, end: 31 }),
            frameRate: 5,
            repeat: -1
        });

        // Book abimations:
        scene.anims.create({
            key: 'book_flip_left',
            frames: scene.anims.generateFrameNumbers('BookAnimation', { start: 0, end: 8 }),
            frameRate: 14,
            repeat: 0
        });
        scene.anims.create({
            key: 'book_flip_right',
            frames: scene.anims.generateFrameNumbers('BookAnimation', { start: 9, end: 17 }),
            frameRate: 14,
            repeat: 0
        });
        // Run animations
        scene.anims.create({
            key: 'run_right',
            frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: 'run_left',
            frames: scene.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: 'run_down',
            frames: scene.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });

        scene.anims.create({
            key: 'run_up',
            frames: scene.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });

        // Idle animations
        scene.anims.create({
            key: 'idle_right',
            frames: scene.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
            frameRate: 5,
            repeat: -1
        });

        scene.anims.create({
            key: 'idle_left',
            frames: scene.anims.generateFrameNumbers('player', { start: 20, end: 23 }),
            frameRate: 5,
            repeat: -1
        });

        scene.anims.create({
            key: 'idle_down',
            frames: scene.anims.generateFrameNumbers('player', { start: 24, end: 27 }),
            frameRate: 5,
            repeat: -1
        });

        scene.anims.create({
            key: 'idle_up',
            frames: scene.anims.generateFrameNumbers('player', { start: 28, end: 31 }),
            frameRate: 5,
            repeat: -1
        });
    }
    create(scene) {

        this.createAnimations(scene)
    }

}
class ScreenMeasureScene extends Phaser.Scene {
    /*
        Helper scene for positiong UI elements.
    */
    constructor() {
        super({ key: 'screenMeasure' });
        this.horizontalLine = null;
        this.verticalLine = null;
        this.horizontalText = null;
        this.verticalText = null;
        this.horizontalHandle = null;
        this.verticalHandle = null;
        this.lineLayer = null;
        this.launchedFrom = null;
    }
    init(data) {
        this.launchedFrom = data.launchedFrom || 'game';
    }
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create a new layer for lines
        this.lineLayer = this.add.layer();
        this.lineLayer.setDepth(2000);

        // Create the horizontal line
        this.horizontalLine = this.add.line(0, 0, 0, 0, width, 0, 0xff0000, 0.5);
        this.horizontalLine.setOrigin(0, 0);
        this.horizontalLine.setLineWidth(1);
        this.lineLayer.add(this.horizontalLine);

        // Create the vertical line
        this.verticalLine = this.add.line(0, 0, 0, 0, 0, height, 0xff0000, 0.5);
        this.verticalLine.setOrigin(0, 0);
        this.verticalLine.setLineWidth(1);
        this.lineLayer.add(this.verticalLine);

        // Create the horizontal handle
        this.horizontalHandle = this.add.rectangle(0, 0, 40, 10, 0xff0000, 0.5);
        this.horizontalHandle.setOrigin(0.5, 0.5);
        this.horizontalHandle.setInteractive({ draggable: true, useHandCursor: true });
        this.lineLayer.add(this.horizontalHandle);

        // Create the vertical handle
        this.verticalHandle = this.add.rectangle(0, 0, 10, 40, 0xff0000, 0.5);
        this.verticalHandle.setOrigin(0.5, 0.5);
        this.verticalHandle.setInteractive({ draggable: true, useHandCursor: true });
        this.lineLayer.add(this.verticalHandle);

        // Prevent click-through and propagation on the handles
        this.horizontalHandle.on('pointerdown', function(pointer) {
            pointer.event.stopPropagation();
        });
        this.verticalHandle.on('pointerdown', function(pointer) {
            pointer.event.stopPropagation();
        });

        // Create the horizontal distance text
        this.horizontalText = this.add.text(40, 40, 'Y: 0px', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        });
        this.lineLayer.add(this.horizontalText);

        // Create the vertical distance text
        this.verticalText = this.add.text(40, 60, 'X: 0px', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        });
        this.lineLayer.add(this.verticalText);

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (gameObject === this.horizontalHandle) {
                dragY = Phaser.Math.Clamp(dragY, 0, height);
                this.horizontalHandle.y = dragY;
                this.horizontalLine.y = dragY;
                this.horizontalLine.geom.y1 = 0;
                this.horizontalLine.geom.y2 = 0;
                this.horizontalText.setText(`Height: ${Math.round(dragY)}px`);
                this.horizontalText.y = dragY + 15;
            } else if (gameObject === this.verticalHandle) {
                dragX = Phaser.Math.Clamp(dragX, 0, width);
                this.verticalHandle.x = dragX;
                this.verticalLine.x = dragX;
                this.verticalLine.geom.x1 = 0;
                this.verticalLine.geom.x2 = 0;
                this.verticalText.setText(`Width: ${Math.round(dragX)}px`);
                this.verticalText.x = dragX + 15;
            }
        });

        // Prevent drag from propagating to the scene
        this.input.on('dragstart', (pointer, gameObject) => {
            if (gameObject === this.horizontalHandle || gameObject === this.verticalHandle) {
                pointer.event.stopPropagation();
            }
        });

        // Add close button
        const closeButton = this.add.text(width - 60, 10, 'Close', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setInteractive();
        this.lineLayer.add(closeButton);

        closeButton.on('pointerdown', () => {
            this.closeScreenMeasure();
        });

        // Add keyboard event to close the scene
        this.input.keyboard.on('keydown-ESC', () => {
            this.closeScreenMeasure();
        });

        // Add keyboard events for 'X' and 'Y' keys
        this.input.keyboard.on('keydown-X', () => {
            this.moveVerticalLineToMouse();
        });

        this.input.keyboard.on('keydown-Y', () => {
            this.moveHorizontalLineToMouse();
        });

        // Initialize the lines at the edges
        this.horizontalHandle.y = 0;
        this.horizontalLine.y = 0;
        this.verticalHandle.x = 0;
        this.verticalLine.x = 0;
        this.updateMeasurements();
    }
    closeScreenMeasure() {
        this.scene.resume(this.launchedFrom);
        this.scene.stop();
    }
    moveVerticalLineToMouse() {
        const mouseX = this.input.mousePointer.x;
        const clampedX = Phaser.Math.Clamp(mouseX, 0, this.cameras.main.width);
        this.verticalHandle.x = clampedX;
        this.verticalLine.x = clampedX;
        this.verticalLine.geom.x1 = 0;
        this.verticalLine.geom.x2 = 0;
        this.updateMeasurements();
    }
    moveHorizontalLineToMouse() {
        const mouseY = this.input.mousePointer.y;
        const clampedY = Phaser.Math.Clamp(mouseY, 0, this.cameras.main.height);
        this.horizontalHandle.y = clampedY;
        this.horizontalLine.y = clampedY;
        this.horizontalLine.geom.y1 = 0;
        this.horizontalLine.geom.y2 = 0;
        this.updateMeasurements();
    }
    updateMeasurements() {
        this.horizontalText.setText(`Height: ${Math.round(this.horizontalHandle.y)}px`);
        this.horizontalText.y = this.horizontalHandle.y + 15;
        this.verticalText.setText(`Width: ${Math.round(this.verticalHandle.x)}px`);
        this.verticalText.x = this.verticalHandle.x + 15;
    }
}
class PerformanceMonitor {
    constructor(scene) {
        this.scene = scene;
        this.fps = 0;
        this.memoryUsage = 0;
        this.programRunTime = 0;
        this.frameCount = 0;
        this.lastSecond = 0;
        this.startTime = performance.now();

        const rightAlign = this.scene.sys.game.config.width - 200;

        this.fpsText = this.scene.add.text(rightAlign, 10, '', { fontSize: '16px', fill: '#ffffff' });
        this.memoryText = this.scene.add.text(rightAlign, 30, '', { fontSize: '16px', fill: '#ffffff' });
        this.runtimeText = this.scene.add.text(rightAlign, 50, '', { fontSize: '16px', fill: '#ffffff' });
        this.executionTimeText = this.scene.add.text(rightAlign, 70, '', { fontSize: '16px', fill: '#ffffff' });

        this.fpsText.setScrollFactor(0).setDepth(1000);
        this.memoryText.setScrollFactor(0).setDepth(1000);
        this.runtimeText.setScrollFactor(0).setDepth(1000);
        this.executionTimeText.setScrollFactor(0).setDepth(1000);
    }
    update(time, delta) {
        this.frameCount++;
        const currentSecond = Math.floor(time / 1000);

        if (currentSecond !== this.lastSecond) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastSecond = currentSecond;
        }

        this.programRunTime = (performance.now() - this.startTime) / 1000;

        if (window.performance && window.performance.memory) {
            this.memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
        }

        this.fpsText.setText(`FPS: ${this.fps}`);
        this.memoryText.setText(`Memory: ${this.memoryUsage} MB`);
        this.runtimeText.setText(`Runtime: ${this.programRunTime.toFixed(2)} s`);
        this.executionTimeText.setText(`Frame Time: ${delta.toFixed(2)} ms`);
    }
}

//########################################################################################################################################################################################################################################################
// ++ COMPONENTS ++ 
//########################################################################################################################################################################################################################################################
class MovementComponent {
    /*
        Movmenemt component that can be attached to any enemy to give them access to A* movement.
    */
    constructor(scene, entity, tileSize = 32, moveSpeed = 200, drawPath = false) {
        this.scene = scene;
        this.entity = entity;
        this.tileSize = tileSize;
        this.moveSpeed = moveSpeed;
        this.path = null;
        this.currentPathIndex = 0;
        this.heading = 'down'; // New property to track heading
        this.isMoving = false;
        this.isChangingPath = false;
        this.pathGraphics = scene.add.graphics();
        this.pathGraphics.setDepth(3);
        this.drawPath = drawPath;
    }
    moveTo(tileX, tileY, path) {
        if (path && path.length > 0) {
            this.path = path;
            this.currentPathIndex = 0;
            this.isMoving = true;
            this.isChangingPath = false;
            if (this.drawPath) {
                this.drawPathVisual();
            }
            this.moveToNextTile();
        } else {
            console.log("No valid path found");
        }
    }
    moveToNextTile() {
        if (this.path && this.currentPathIndex < this.path.length) {
            const target = this.path[this.currentPathIndex];
            this.moveTowardsTarget(target, 16.67); // Assuming 60 FPS
        }
    }
    moveTowardsTarget(target, delta) {
        const angle = Phaser.Math.Angle.Between(this.entity.x, this.entity.y, target.x, target.y);
        const distance = this.moveSpeed * delta / 1000;
        this.entity.x += Math.cos(angle) * distance;
        this.entity.y += Math.sin(angle) * distance;
        this.isMoving = true;

        // Update heading based on movement direction
        this.updateHeading(angle);

        // Trigger animation update if the entity has a method for it
        if (typeof this.entity.updateAnimation === 'function') {
            this.entity.updateAnimation(angle);
        }
    }
    updateHeading(angle) {
        const directions = ['right', 'down', 'left', 'up'];
        const index = Math.round(angle / (Math.PI / 2)) & 3;
        this.heading = directions[index];
    }
    update(time, delta) {
        if (this.path && this.currentPathIndex < this.path.length) {
            const target = this.path[this.currentPathIndex];
            const distance = Phaser.Math.Distance.Between(this.entity.x, this.entity.y, target.x, target.y);

            if (distance < 2) {
                this.entity.x = target.x;
                this.entity.y = target.y;
                this.currentPathIndex++;
                if (this.drawPath) {
                    this.drawPathVisual();
                }
                
                if (this.currentPathIndex >= this.path.length) {
                    this.stopMoving();
                } else {
                    this.moveToNextTile();
                }
            } else {
                this.moveTowardsTarget(target, delta);
            }
        }
    }
    stopMoving() {
        this.path = null;
        this.isMoving = false;
        this.isChangingPath = false;
        this.clearPath();
        
        // Trigger idle animation if the entity has a method for it
        if (typeof this.entity.playIdleAnimation === 'function') {
            this.entity.playIdleAnimation();
        }
    }
    getIsMoving() {
        return this.isMoving;
    }
    getHeading() {
        return this.heading;
    }
    drawPathVisual() {
        this.clearPath();
        if (this.path && this.path.length > this.currentPathIndex) {
            this.pathGraphics.lineStyle(1, 0xffff00, 1);
            
            const remainingPath = this.path.slice(this.currentPathIndex);
            const perimeter = this.getPathPerimeter(remainingPath);
            
            if (perimeter.length > 0) {
                this.pathGraphics.moveTo(perimeter[0].x, perimeter[0].y);
                
                for (let i = 1; i < perimeter.length; i++) {
                    this.pathGraphics.lineTo(perimeter[i].x, perimeter[i].y);
                }
                
                this.pathGraphics.lineTo(perimeter[0].x, perimeter[0].y);
                this.pathGraphics.strokePath();
            }
        }
    }
    clearPath() {
        if (this.pathGraphics) {
            this.pathGraphics.clear();
        }
    }
    getPathPerimeter(path) {
        if (path.length < 2) return path;

        const perimeter = [];
        const directions = [
            {dx: 0, dy: -1},  // up
            {dx: 1, dy: -1},  // up-right
            {dx: 1, dy: 0},   // right
            {dx: 1, dy: 1},   // down-right
            {dx: 0, dy: 1},   // down
            {dx: -1, dy: 1},  // down-left
            {dx: -1, dy: 0},  // left
            {dx: -1, dy: -1}  // up-left
        ];

        for (let i = 0; i < path.length; i++) {
            const current = path[i];
            for (const dir of directions) {
                const neighborX = current.x + dir.dx * this.tileSize;
                const neighborY = current.y + dir.dy * this.tileSize;
                if (!path.some(p => p.x === neighborX && p.y === neighborY)) {
                    // This side or corner is on the perimeter
                    const cornerX = current.x + (dir.dx * this.tileSize / 2);
                    const cornerY = current.y + (dir.dy * this.tileSize / 2);
                    perimeter.push({x: cornerX, y: cornerY});
                }
            }
        }

        return this.sortPerimeterPoints(perimeter);
    }
    sortPerimeterPoints(points) {
        if (points.length <= 1) return points;

        const sorted = [points[0]];
        const unsorted = points.slice(1);

        while (unsorted.length > 0) {
            const last = sorted[sorted.length - 1];
            let nearestIndex = 0;
            let nearestDistance = Infinity;

            for (let i = 0; i < unsorted.length; i++) {
                const distance = Phaser.Math.Distance.Between(last.x, last.y, unsorted[i].x, unsorted[i].y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }

            sorted.push(unsorted[nearestIndex]);
            unsorted.splice(nearestIndex, 1);
        }

        return sorted;
    }
    setDrawPath(drawPath) {
        this.drawPath = drawPath;
        if (!this.drawPath) {
            this.clearPath();
        } else if (this.path) {
            this.drawPathVisual();
        }
    }
}
class CombatComponent {
    constructor(entity) {
        this.entity = entity;
        this.attackPower = 10; // Default attack power
        this.defencePower = 5; // Default defence power
        this.isAttacking = false;
        this.attackCooldown = 1000; // 1 second cooldown between attacks
        this.lastAttackTime = 0;
    }
    attack(target) {
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            console.log("Attack on cooldown");
            return;
        }

        if (target && target.combatComponent) {
            const damage = Math.max(0, this.attackPower - target.combatComponent.defencePower);
            target.combatComponent.receiveDamage(damage);
            console.log(`${this.entity.constructor.name} attacks ${target.constructor.name} for ${damage} damage!`);
            this.lastAttackTime = currentTime;
        } else {
            console.log("Invalid target or target doesn't have a combat component");
        }
    }
    receiveDamage(amount) {
        if (this.entity.health) {
            this.entity.health -= amount;
            console.log(`${this.entity.constructor.name} receives ${amount} damage. Health: ${this.entity.health}`);
            this.showDamageNumber(amount);
            if (this.entity.health <= 0) {
                this.die();
            }
        } else {
            console.log("Entity doesn't have a health property");
        }
    }
    showDamageNumber(amount) {
        const scene = this.entity.scene;
        const x = this.entity.sprite.x;
        const y = this.entity.sprite.y - this.entity.sprite.height / 2;

        const damageText = scene.add.text(x, y, `-${amount}`, {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ff0000',
            stroke: '#ffffff',
            strokeThickness: 2
        });
        damageText.setOrigin(0.5);

        scene.tweens.add({
            targets: damageText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
    die() {
        console.log(`${this.entity.constructor.name} has been defeated!`);
        // Implement death logic here (e.g., remove from game, play death animation, etc.)
    }
    setAttackPower(power) {
        this.attackPower = power;
    }
    setDefencePower(power) {
        this.defencePower = power;
    }
}
class RightClickMenuScene extends Phaser.Scene {
    /*
        Right click menu that allows players to interact with the game world.
    */
    constructor() {
        super({ key: 'rightClickMenu' });
        this.width = 120;
        this.height = 160;
        this.padding = 5;
        this.itemHeight = 30;
    }
    create(data) {
        this.x = data.x;
        this.y = data.y;
        this.parentScene = data.parentScene;
        this.clickedEnemy = data.clickedEnemy;

        // Create background
        this.background = this.add.rectangle(0, 0, this.width, this.height, 0xffffff);
        this.background.setOrigin(0);

        // Create border
        this.border = this.add.graphics();
        this.border.lineStyle(2, 0x000000, 1);
        this.border.strokeRect(0, 0, this.width, this.height);

        // Add menu items
        const menuItems = ['Attack', 'Move', 'Interact', 'Inspect', 'Cancel'];
        menuItems.forEach((item, index) => {
            const y = this.padding + index * (this.itemHeight + this.padding);
            const text = this.add.text(this.padding, y, item, { 
                fontSize: '16px', 
                fill: '#000000',
                fontFamily: 'PixelifyRegular'
            });
            text.setInteractive();

            // Add hover effect
            text.on('pointerover', () => {
                text.setBackgroundColor('#cccccc');
            });
            text.on('pointerout', () => {
                text.setBackgroundColor(null);
            });

            // Add click functionality
            text.on('pointerdown', () => {
                this.handleMenuItemClick(item);
            });
        });

        // Add close functionality when clicking outside the menu
        this.input.on('pointerdown', (pointer) => {
            if (pointer.x < 0 || pointer.x > this.width || pointer.y < 0 || pointer.y > this.height) {
                this.closeMenu();
            }
        });

        // Set the camera and world bounds to match the menu size
        this.cameras.main.setViewport(this.x, this.y, this.width, this.height);
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.setZoom(1);
        this.physics.world.setBounds(0, 0, this.width, this.height);
    }
    handleMenuItemClick(item) {
        switch (item) {
            case 'Attack':
                console.log('Attack action selected');
                // Implement attack logic here
                break;
            case 'Move':
                console.log('Move action selected');
                // Implement move logic here
                break;
            case 'Interact':
                console.log('Interact action selected');
                // Implement interact logic here
                break;
            case 'Inspect':
                console.log('Inspect action selected');
                if (this.clickedEnemy) {
                    this.scene.launch('enemyInfo', { 
                        enemy: this.clickedEnemy,
                        x: this.x,
                        y: this.y
                    });
                }
                break;
            case 'Cancel':
                this.closeMenu();
                break;
        }
        this.closeMenu();
    }
    closeMenu() {
        this.scene.stop();
    }
}

//########################################################################################################################################################################################################################################################
// ++ Objects ++
//########################################################################################################################################################################################################################################################
class Tile {
    constructor(x, y, type, properties = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.properties = properties;
        this.entities = new Set();
    }
    addEntity(entity) {
        this.entities.add(entity);
    }
    removeEntity(entity) {
        this.entities.delete(entity);
    }
    hasCollision() {
        return this.properties.collides || false;
    }
}
class Light {
    /*
        A light object for use inside of the LightSystem.
        Toggleable flicker and wobble.
        Intensity control.
        Falloff control.
    */
    constructor(x, y, intensity, radius, parentObject = null, color = 0xffffff, falloff = 1, height = 10) {
        this.gameObject = parentObject; // The light's parent object - If one is assigned the light will follow it.
        this.defaultPosition = [x, y];
        this.x = x;
        this.y = y;
        this.baseIntesity = intensity;
        this.intensity = intensity; // Brightness of the light.
        this.baseRadius = radius; // Light source radius.
        this.radius = radius; // Light source radius.
        this.height = height; // Height of the light souce above the ground.
        this.color = color; // Colour of the light source

        this.falloff = falloff; // How fast shadows falloff after they're cast. 
        this.pulseUniformity = 1; // How different pulse lengths are (Lower the number = randomer)
        this.flickerSpeed = 0.5; // Time between pulses. (in no particular unit)
        this.flickerAmount = 40; // Amount of deviance allowed from baseRadius in pixels. 
        
        this.flickerEnabled = false;
        this.wobbleEnabled = true;
        this.ascending = true;
        this.wobbleSpeed = 0.2;
        this.wobbleAmount = 1;
        this.wobbleOffsetX = 0;
        this.wobbleOffsetY = 0;
        this.wobbleAngleX = Math.random() * Math.PI * 2;
        this.wobbleAngleY = Math.random() * Math.PI * 2;
    }
    enableFlicker(){
        this.flickerEnabled = true;
    }
    disableFlicker(){
        this.flicker = false;
    }
    enableWobble(){
        this.wobbleEnabled = true;
    }
    disableWobble(){
        this.wobbleEnabled = false;
    }
    setFlicker(flicker=1){
        this.flickerAmount = flicker;
    }
    setWobble(wobble=1){
        this.wobbleAmount = wobble;
    }
    flickerLight(){
        // If wobble is also enabled flicker is calculated based off of wobble. Otherwise,
        // flicker is based off a random roll.
        if (this.flickerEnabled){
            if (this.wobbleEnabled){

                this.radius = this.baseRadius + ((this.defaultPosition[0] + this.defaultPosition[1]) - (this.x + this.y)) * 4;
            }else{
                if (this.ascending){
                    this.intensity += (Math.random()* 0.1)/2;
                    if(this.intensity > this.baseIntesity + (Math.random()* 0.3)){
                        this.ascending = false;
                    }
                }else{
                    this.intensity -= (Math.random()* 0.1)/2;
                    if(this.intensity < this.baseIntesity - (Math.random() *0.3)){
                        this.ascending = true;
                    }
                }
                
            }
        }
    }
    normalize(value, min, max) { // Converts a value to a range of 0 - 1.
        return ((value - min) / (max - min));
    }
    updateWobble() {
        if (this.wobbleEnabled){
            if (this.x > this.defaultPosition[0] + this.wobbleAngleX){
                this.x = this.defaultPosition[0] + this.wobbleAngleX;
            } 
            if (this.x < this.defaultPosition[0] - this.wobbleAngleX){
                this.x = this.defaultPosition[0] - this.wobbleAngleX;
            }
            if (this.y > this.defaultPosition[1] + this.wobbleAngleY){
                this.y = this.defaultPosition[1] + this.wobbleAngleY;
            } 
            if (this.y < this.defaultPosition[1] - this.wobbleAngleY){
                this.y = this.defaultPosition[1] - this.wobbleAngleY;
            }
            
            this.wobbleAngleX = Math.random() * Math.PI * 2;
            this.wobbleAngleY = Math.random() * Math.PI * 2;
            this.wobbleAngleX += this.wobbleSpeed * (Math.random()) * 0.5;
            this.wobbleAngleY += this.wobbleSpeed * (Math.random()) * 0.5;
            this.wobbleOffsetX = Math.cos(this.wobbleAngleX) * this.wobbleAmount * Math.random();
            this.wobbleOffsetY = Math.sin(this.wobbleAngleY) * this.wobbleAmount * Math.random();
        }
    }
    update(x, y, delta) {
        this.x = x + this.wobbleOffsetX;
        this.y = y + this.wobbleOffsetY;
        this.updateWobble();
        this.flickerLight();
        
    }
}
class Noise {
    constructor() {
        this.randomSeed = Math.random() * 10000;
        this.noiseFrequency = 0.1;
        this.noiseAmplitude = 0.3;
        this.noisePersistence = 0.6;
        this.noiseOctaves = 2;
        this.noiseDirection = new Phaser.Math.Vector2(1, 0); // Default direction: right
        this.noiseSpeed = 5; // Default speed
        this.noiseTime = 0; // Time accumulator for noise movement
        this.p = new Uint8Array(512);
        this.initNoise();
    }
    setNoiseDirection(x, y) {
        this.noiseDirection.set(x, y).normalize();
    }
    setNoiseSpeed(speed) {
        this.noiseSpeed = speed;
    }
    simpleNoise(x, y) {
        let noise = 0;
        let frequency = this.noiseFrequency;
        let amplitude = this.noiseAmplitude;
        
        // Apply directional movement to the noise
        const movementX = this.noiseDirection.x * this.noiseTime * this.noiseSpeed;
        const movementY = this.noiseDirection.y * this.noiseTime * this.noiseSpeed;
        
        for (let i = 0; i < this.noiseOctaves; i++) {
            const sampleX = (x + movementX) * frequency + this.randomSeed;
            const sampleY = (y + movementY) * frequency + this.randomSeed;
            
            const perlinValue = this.improvedNoise(sampleX, sampleY);
            noise += perlinValue * amplitude;
            
            frequency *= 2;
            amplitude *= this.noisePersistence;
        }
        
        return noise;
    }
    improvedNoise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this.fade(x);
        const v = this.fade(y);
        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;
        return this.lerp(v, this.lerp(u, this.grad(this.p[A], x, y), 
                                         this.grad(this.p[B], x - 1, y)),
                            this.lerp(u, this.grad(this.p[A + 1], x, y - 1),
                                         this.grad(this.p[B + 1], x - 1, y - 1)));
    }
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    lerp(t, a, b) {
        return a + t * (b - a);
    }
    grad(hash, x, y) {
        const h = hash & 15;
        const grad_x = 1 + (h & 7);
        const grad_y = 1 + ((h >> 3) & 7);
        return ((h & 8) ? -grad_x : grad_x) * x + ((h & 8) ? -grad_y : grad_y) * y;
    }
    initNoise() {
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }
        for (let i = 0; i < 255; i++) {
            const r = i + ~~(Math.random() * (256 - i));
            const aux = this.p[i];
            this.p[i] = this.p[r];
            this.p[r] = aux;
        }
        for (let i = 0; i < 256; i++) {
            this.p[i + 256] = this.p[i];
        }
    }
    setNoiseFrequency(frequency) {
        this.noiseFrequency = frequency;
    }
    setNoiseAmplitude(amplitude) {
        this.noiseAmplitude = amplitude;
    }
    setNoisePersistence(persistence) {
        this.noisePersistence = persistence;
    }
    setNoiseOctaves(octaves) {
        this.noiseOctaves = octaves;
    }
    update(delta) {
        this.noiseTime += delta / 1000; // Convert delta to seconds
    }
}
class Skills{
    // Convert to constant.
    // load from local server while developing.  
    constructor(){
        this.skillData = {
            autoAttack: {
                name: 'Auto Attack',
                damage: 2,
                type: 'physical',
                speed: 0.3 // percent of a game tick.

            }

        }
    }

}


//########################################################################################################################################################################################################################################################
// ++ SYSTEMS ++
//########################################################################################################################################################################################################################################################
class AStar {
    /*
        A* pathfinding system used in the movementComponent.
        Can be hooked into to find paths for any item or to find out if a point is reachable.
    */
    constructor(scene) {
        this.scene = scene;
        this.debugGraphics = scene.add.graphics();
        this.debugGraphics.setDepth(5);
        this.tileSize = GameConfig.tileSize;
    }
    findPath(startX, startY, endX, endY) {
        const grid = this.createGrid();
        const start = this.getTileCoordinates(startX, startY);
        const end = this.getTileCoordinates(endX, endY);

        // Check if start or end points are out of bounds or on a collision tile
        if (!this.isValidTile(start.x, start.y, grid) || !this.isValidTile(end.x, end.y, grid)) {
            console.log("Invalid start or end point for pathfinding");
            return null;
        }

        start.f = 0;
        start.g = 0;
        start.h = 0;
        start.parent = null;

        const openList = [start];
        const closedList = [];

        while (openList.length > 0) {
            let currentNode = openList[0];
            let currentIndex = 0;

            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < currentNode.f) {
                    currentNode = openList[i];
                    currentIndex = i;
                }
            }

            openList.splice(currentIndex, 1);
            closedList.push(currentNode);

            if (currentNode.x === end.x && currentNode.y === end.y) {
                let path = [];
                let current = currentNode;
                while (current !== null) {
                    path.push({ 
                        x: current.x * this.tileSize + this.tileSize / 2, 
                        y: current.y * this.tileSize + this.tileSize / 2 
                    });
                    current = current.parent;
                }
                path = path.reverse();
                if (GameConfig.debugPathVisualization) {
                    this.visualizePath(path, end);
                }
                return path;
            }

            const neighbors = this.getNeighbors(currentNode, grid);
            for (let neighbor of neighbors) {
                if (closedList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    continue;
                }

                neighbor.g = currentNode.g + 1;
                neighbor.h = this.heuristic(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = currentNode;

                if (!openList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openList.push(neighbor);
                }
            }
        }

        console.log("No path found");
        return null;
    }
    createGrid() {
        const map = this.scene.levelManager.currentLevel;
        const layerData = map.layers[0].data;
        const grid = [];

        for (let y = 0; y < map.height; y++) {
            grid[y] = [];
            for (let x = 0; x < map.width; x++) {
                const tile = layerData[y][x];
                grid[y][x] = tile && tile.properties.collides ? 1 : 0;
            }
        }

        return grid;
    }
    getNeighbors(node, grid) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (let dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;

            if (this.isValidTile(newX, newY, grid)) {
                neighbors.push({ x: newX, y: newY });
            }
        }

        return neighbors;
    }
    isValidTile(x, y, grid) {
        return x >= 0 && x < grid[0].length && y >= 0 && y < grid.length && grid[y][x] === 0;
    }
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    getTileCoordinates(x, y) {
        return {
            x: Math.floor(x / this.tileSize),
            y: Math.floor(y / this.tileSize)
        };
    }
    visualizePath(path, end) {
        this.debugGraphics.clear();

        this.debugGraphics.fillStyle(0x00ff00, 0.3);
        for (let i = 0; i < path.length - 1; i++) {
            this.debugGraphics.fillRect(
                path[i].x - this.tileSize / 2,
                path[i].y - this.tileSize / 2,
                this.tileSize,
                this.tileSize
            );
        }

        this.debugGraphics.fillStyle(0xffff00, 0.3);
        this.debugGraphics.fillRect(end.x * this.tileSize, end.y * this.tileSize, this.tileSize, this.tileSize);

        this.debugGraphics.lineStyle(2, 0xffff00, 1);
        this.debugGraphics.strokeRect(end.x * this.tileSize, end.y * this.tileSize, this.tileSize, this.tileSize);
    }
}
class LevelManager {
    /*
        Handles level data and loading of level data.
    */
    constructor(scene) {
        this.scene = scene;
        this.tileSize = 16;
        this.currentLevel = null;
        this.levels = {};
        this.chunkSize = 40 * 32; // 40 times the tilemap cell size (assuming 32x32 tiles)
        this.chunks = {};
        this.activeChunks = new Set();
        this.updateRadius = 2; // Number of chunks around the player to keep active
        
    }
    preload() {
        // Preload all level data
        this.scene.load.tilemapTiledJSON('level1', 'https://play.rosebud.ai/assets/map.tmj?nkKz');
        
        // Preload tileset image(s)
        this.scene.load.image('roguelikeSheet_transparent', 'https://play.rosebud.ai/assets/roguelikeSheet_transparent.png?QicF');
    }
    addLevel(key, data) {
        this.levels[key] = data;
    }
    loadLevel(key) {
        if (this.currentLevel) {
            this.unloadCurrentLevel();
        }

        console.log(`Loading level: ${key}`);

        try {
            // Create the tilemap
            this.currentLevel = this.scene.make.tilemap({ key: key });
            if (!this.currentLevel) {
                console.error(`Failed to create tilemap for level ${key}`);
                return;
            }
            // Set map dimensions
            this.mapWidth = this.currentLevel.widthInPixels;
            this.mapHeight = this.currentLevel.heightInPixels;
            
            console.log('Tilemap created successfully');
            console.log('Available tilesets:', this.currentLevel.tilesets.map(tileset => tileset.name));
            console.log('Available layers:', this.currentLevel.layers.map(layer => layer.name));

            // Find the correct tileset name from the Tiled map
            const tilesetName = this.currentLevel.tilesets[0].name;
            console.log('Using tileset name:', tilesetName);

            const tileset = this.currentLevel.addTilesetImage(tilesetName, 'roguelikeSheet_transparent');
            if (!tileset) {
                console.error(`Failed to add tileset for level ${key}. Tileset name: ${tilesetName}`);
                return;
            }
            console.log('Tileset added successfully');

            // Create chunks
            this.createChunks();

            // Set world bounds
            this.scene.physics.world.bounds.width = this.currentLevel.widthInPixels;
            this.scene.physics.world.bounds.height = this.currentLevel.heightInPixels;

            // Set camera bounds
            this.scene.cameras.main.setBounds(0, 0, this.currentLevel.widthInPixels, this.currentLevel.heightInPixels);

            // Position the player at the level's start point
            const startPoint = this.findObjectByType('StartPoint', this.currentLevel);
            if (startPoint) {
                this.scene.player.sprite.setPosition(startPoint.x, startPoint.y);
            } else {
                console.warn(`No StartPoint found in level ${key}`);
                // Set a default starting position
                this.scene.player.sprite.setPosition(100, 100);
            }

            console.log('Level loaded successfully:', key);

        } catch (error) {
            console.error(`Error loading level ${key}:`, error);
        }
    }
    getMapDimensions() {
        return {
            width: this.mapWidth,
            height: this.mapHeight
        };
    }
    createChunks() {
        const { width, height } = this.currentLevel;
        for (let y = 0; y < height; y += this.chunkSize) {
            for (let x = 0; x < width; x += this.chunkSize) {
                const chunkKey = `${x},${y}`;
                this.chunks[chunkKey] = this.createChunk(x, y);
            }
        }
    }
    createChunk(x, y) {
        const chunk = {
            x,
            y,
            layers: []
        };

        this.currentLevel.layers.forEach((layerData, index) => {
            const layer = this.currentLevel.createLayer(
                layerData.name,
                this.currentLevel.tilesets[0],
                x,
                y,
                this.chunkSize,
                this.chunkSize,
                32,
                32
            );
            layer.setVisible(false);
            layer.setDepth(Layers.ground + index);
            chunk.layers.push(layer);
        });

        return chunk;
    }
    updateChunks(playerX, playerY) {
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkY = Math.floor(playerY / this.chunkSize);

        const newActiveChunks = new Set();

        for (let dy = -this.updateRadius; dy <= this.updateRadius; dy++) {
            for (let dx = -this.updateRadius; dx <= this.updateRadius; dx++) {
                const chunkX = playerChunkX + dx;
                const chunkY = playerChunkY + dy;
                const chunkKey = `${chunkX * this.chunkSize},${chunkY * this.chunkSize}`;

                if (this.chunks[chunkKey]) {
                    newActiveChunks.add(chunkKey);
                    if (!this.activeChunks.has(chunkKey)) {
                        this.activateChunk(chunkKey);
                    }
                }
            }
        }

        for (const chunkKey of this.activeChunks) {
            if (!newActiveChunks.has(chunkKey)) {
                this.deactivateChunk(chunkKey);
            }
        }

        this.activeChunks = newActiveChunks;
    }
    activateChunk(chunkKey) {
        const chunk = this.chunks[chunkKey];
        chunk.layers.forEach(layer => layer.setVisible(true));
    }
    deactivateChunk(chunkKey) {
        const chunk = this.chunks[chunkKey];
        chunk.layers.forEach(layer => layer.setVisible(false));
    }
    unloadCurrentLevel() {
        if (this.currentLevel) {
            Object.values(this.chunks).forEach(chunk => {
                chunk.layers.forEach(layer => layer.destroy());
            });
            
            this.chunks = {};
            this.activeChunks.clear();
            
            // Destroy the tilemap
            this.currentLevel.destroy();
            this.currentLevel = null;
        }
    }
    findObjectByType(type, tilemap) {
        const objectLayer = tilemap.getObjectLayer('Objects');
        if (objectLayer) {
            return objectLayer.objects.find(object => object.type === type);
        }
        return null;
    }
}
class CameraManager {
    /*
        Camera manager that allows for camera position smothing, follow object switching and momentary
        point of interest focus
     */
    constructor(scene, player) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.player = player;
        this.isFollowingPlayer = true;
        this.followOffset = { x: 0, y: 0 };
        this.lerpFactor = 0.1; // Adjust this value for different smoothing effects
    }
    followPlayer() {
        this.isFollowingPlayer = true;
    }
    update() {
        if (this.isFollowingPlayer) {
            const targetX = this.player.sprite.x + this.followOffset.x;
            const targetY = this.player.sprite.y + this.followOffset.y;

            this.camera.scrollX = Phaser.Math.Linear(this.camera.scrollX, targetX - this.camera.width * 0.5, this.lerpFactor);
            this.camera.scrollY = Phaser.Math.Linear(this.camera.scrollY, targetY - this.camera.height * 0.5, this.lerpFactor);
        }
    }
    setLerpFactor(factor) {
        this.lerpFactor = Phaser.Math.Clamp(factor, 0, 1);
    }
}
class Inventory {
    // The base inventory class that visual panels extend from. 
    // Contains the logic for the Player inventory.
    constructor(size) {
        this.size = size;
        this.items = new Array(size).fill(null);
    }
    addItem(item) {
        const emptySlot = this.items.findIndex(slot => slot === null);
        if (emptySlot !== -1) {
            this.items[emptySlot] = item;
            return true;
        }
        return false; // Inventory is full
    }
    removeItem(index) {
        if (index >= 0 && index < this.size && this.items[index] !== null) {
            const item = this.items[index];
            this.items[index] = null;
            return item;
        }
        return null;
    }
    getItem(index) {
        if (index >= 0 && index < this.size) {
            return this.items[index];
        }
        return null;
    }
    isFull() {
        return this.items.every(item => item !== null);
    }
    getFirstEmptySlot() {
        return this.items.findIndex(slot => slot === null);
    }
}
class LightingSystem {
    // Lighting currently runs at 60Fps with a cell size of 8px. 
    // Ideally I would like to clamp the FPS to 30FPS and decrese the cell size to 4px. 
    // If I could get it running at 30FPS stable with only the shadows set to a cell size of 4px
    // would be enough shadows density for small objects. 

    //TODO: 

    constructor(scene, width, height) {
        this.scene = scene;
        this.cellSize = LightingConfig.lightCellSize;
        this.width = Math.ceil(width / this.cellSize);
        this.height = Math.ceil(height / this.cellSize);
        this.cells = [];
        this.shadowMap = [];
        this.lightMask = null;
        this.shadowMask = null; 
        this.lights = [];
        this.singlePointLightShadowFalloff = 0.8;
        // Global illumination properties.
        this.globalIlluminationEnabled = true;
        this.globalIlluminationColor = 0xfa9a34; 
        this.globalIlluminationIntensity = 1;
        this.noiseShadowIntensity = 0.2;
        this.noiseScale = 0.5;
        this.noiseOffset = 0;
        // Sun properties.
        this.sunDirection = new Phaser.Math.Vector2(0, 1);
        this.sunIntensity = 0.1; // Default sun intensity
        this.sunShadowLength = 120; // New property to control sun shadow length
        this.sunShadowFalloff = 0.15; // New property to control sun shadow falloff
        // Noise control variables.
        this.noise = new Noise();
       
        this.initLightMap();
        this.initShadowMap();
        this.createLightMask();
        this.createShadowMask();
        this.randomSeed = Math.random() * 10000;
    }
    // Update.
    update(delta) {
        this.noiseTime += delta / 1000; // Convert delta to seconds
        this.noise.update(delta);

        this.initLightMap();
        this.initShadowMap();
 
        const camera = this.scene.cameras.main;
        const visibleLights = this.lights.filter(light => 
            Phaser.Geom.Intersects.RectangleToRectangle(
                new Phaser.Geom.Rectangle(
                    light.x - light.radius, 
                    light.y - light.radius, 
                    light.radius * 2, 
                    light.radius * 2
                ),
                new Phaser.Geom.Rectangle(
                    camera.worldView.x - LightingConfig.lightCullMargin,
                    camera.worldView.y - LightingConfig.lightCullMargin,
                    camera.worldView.width + LightingConfig.lightCullMargin * 2,
                    camera.worldView.height + LightingConfig.lightCullMargin * 2
                )
            )
        );

        // Update shadow map based on objects in the scene
        this.updateShadowMap();
        if(LightingConfig.sunEnabled){
            this.castSunShadows();
        }
        
        // Apply global illumination
        this.applyGlobalIllumination();

        for (const light of visibleLights) {
            this.castShadows(light);

            const cellX = Math.floor(light.x / this.cellSize);
            const cellY = Math.floor(light.y / this.cellSize);
            const cellRadius = Math.ceil(light.radius / this.cellSize);

            const r = (light.color >> 16) & 0xFF;
            const g = (light.color >> 8) & 0xFF;
            const b = light.color & 0xFF;

            const startX = Math.max(0, cellX - cellRadius);
            const startY = Math.max(0, cellY - cellRadius);
            const endX = Math.min(this.width - 1, cellX + cellRadius);
            const endY = Math.min(this.height - 1, cellY + cellRadius);

            for (let y = startY; y <= endY; y++) {
                for (let x = startX; x <= endX; x++) {
                    const dx = x - cellX;
                    const dy = y - cellY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= cellRadius) {
                        const normalizedDistance = distance / cellRadius;
                        const lightValue = Math.max(0.1, 1 - Math.pow(normalizedDistance, light.falloff)) * light.intensity;
                        const intensityFactor = 1 - normalizedDistance;
                        this.cells[y][x].r = Math.min(1, this.cells[y][x].r + lightValue * r / 255 * intensityFactor);
                        this.cells[y][x].g = Math.min(1, this.cells[y][x].g + lightValue * g / 255 * intensityFactor);
                        this.cells[y][x].b = Math.min(1, this.cells[y][x].b + lightValue * b / 255 * intensityFactor);
                    }
                }
            }
        }

        this.lightMask.clear();
        this.shadowMask.clear();

        this.lightMask.fillStyle(0x000000, 0.1);
        this.lightMask.fillRect(
            camera.worldView.x - LightingConfig.lightCullMargin,
            camera.worldView.y - LightingConfig.lightCullMargin,
            camera.worldView.width + LightingConfig.lightCullMargin * 2,
            camera.worldView.height + LightingConfig.lightCullMargin * 2
        );

        const startCellX = Math.max(0, Math.floor((camera.worldView.x - LightingConfig.lightCullMargin) / this.cellSize));
        const startCellY = Math.max(0, Math.floor((camera.worldView.y - LightingConfig.lightCullMargin) / this.cellSize));
        const endCellX = Math.min(this.width - 1, Math.ceil((camera.worldView.x + camera.worldView.width + LightingConfig.lightCullMargin) / this.cellSize));
        const endCellY = Math.min(this.height - 1, Math.ceil((camera.worldView.y + camera.worldView.height + LightingConfig.lightCullMargin) / this.cellSize));

        for (let y = startCellY; y <= endCellY; y++) {
            for (let x = startCellX; x <= endCellX; x++) {
                const cellX = x * this.cellSize;
                const cellY = y * this.cellSize;
                const cell = this.cells[y][x];
                const alpha = Math.max(0.2, LightingConfig.lightMaskAlpha - (cell.r + cell.g + cell.b) / 3);
            
                if (alpha > 0) {
                    const color = Phaser.Display.Color.GetColor(
                        Math.floor(cell.r * 255),
                        Math.floor(cell.g * 255),
                        Math.floor(cell.b * 255)
                    );
                    
                    this.lightMask.fillStyle(color, alpha);
                    this.lightMask.fillRect(cellX, cellY, this.cellSize, this.cellSize);

                    // Draw shadows on the shadow mask
                    this.shadowAlpha = this.shadowMap[y][x];
                    if (this.shadowAlpha >= 1){
                        this.shadowAlpha = 0;
                    }
                    if (this.shadowAlpha > 0 && this.shadowAlpha < 1) {
                        if (this.shadowAlpha > LightingConfig.shadowDarkness){
                        this.shadowMask.fillStyle(0x000000 * color, LightingConfig.shadowDarkness);
                        } else{
                        this.shadowMask.fillStyle(0x000000 * color, this.shadowAlpha);
                        }
                        this.shadowMask.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                    }
                }
            }
        }

        // Update light positions
        this.lights.forEach(light => {
            if (light.gameObject) {
                this.updateLight(light, light.gameObject.x, light.gameObject.y, delta);
            } else {
                this.updateLight(light, light.x, light.y, delta);
            }
        });
    }
    // Sun Sadows.
    setSunDirection(x, y) {
        this.sunDirection.set(x, y).normalize();
    }
    setSunIntensity(intensity) {
        this.sunIntensity = Phaser.Math.Clamp(intensity, 0, 1);
    }
    castSunShadows() {
        const cellSize = this.cellSize;
        const shadowLength = this.sunShadowLength * cellSize;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.shadowMap[y][x] === 1) { // If there's an object at this cell
                    let shadowX = x;
                    let shadowY = y;

                    for (let i = 0; i < shadowLength; i += cellSize) {
                        shadowX += this.sunDirection.x;
                        shadowY += this.sunDirection.y;

                        const cellX = Math.floor(shadowX);
                        const cellY = Math.floor(shadowY);

                        if (cellX < 0 || cellX >= this.width || cellY < 0 || cellY >= this.height) {
                            break; // Stop if we're out of bounds
                        }

                        const distance = Math.sqrt((cellX - x) ** 2 + (cellY - y) ** 2);
                        const shadowIntensity = (this.sunIntensity * Math.exp(-distance * this.sunShadowFalloff)) * 0.8;

                        // Calculate shadow spread based on distance
                        const spreadFactor = 1.5 + (distance / shadowLength) * 0.5; // Adjust 0.5 to control spread amount
                        const spreadRadius = Math.ceil(spreadFactor);

                        // Apply shadow to surrounding cells based on spread
                        for (let sy = -spreadRadius; sy <= spreadRadius; sy++) {
                            for (let sx = -spreadRadius; sx <= spreadRadius; sx++) {
                                const spreadX = cellX + sx;
                                const spreadY = cellY + sy;

                                if (spreadX >= 0 && spreadX < this.width && spreadY >= 0 && spreadY < this.height) {
                                    const spreadDistance = Math.sqrt(sx * sx + sy * sy);
                                    if (spreadDistance <= spreadRadius) {
                                        // Adjust shadow intensity based on sun intensity
                                        this.spreadIntensity = shadowIntensity * (1 - spreadDistance / spreadRadius) * this.sunIntensity;

                                        this.shadowMap[spreadY][spreadX] = Math.max(
                                            this.shadowMap[spreadY][spreadX],
                                            this.spreadIntensity * LightingConfig.shadowDarkness 
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    // Single point lighting. 
    initLightMap() {
        for (let y = 0; y < this.height; y++) {
            this.cells[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x] = { r: 0, g: 0, b: 0 };
            }
        }
    }
    createLightMask() {
        this.lightMask = this.scene.add.graphics();
        this.lightMask.setDepth(Layers.lighting);
    }
    addLight(x, y, intensity, radius, parentObject , color = 0xffffff, falloff = 1, height = 10) {
        const light = new Light(x, y, intensity, radius, parentObject, color, falloff, height);
        this.lights.push(light);
        return light;
    }
    removeLight(light) {
        const index = this.lights.indexOf(light);
        if (index > -1) {
            this.lights.splice(index, 1);
        }
    }
    updateLight(light, x, y, delta) {
        light.update(x, y, delta);
    }
    // Shadows.
    initShadowMap() {
        for (let y = 0; y < this.height; y++) {
            this.shadowMap[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.shadowMap[y][x] = 0;
            }
        }
    }
    createShadowMask() {
        this.shadowMask = this.scene.add.graphics();
        this.shadowMask.setDepth(Layers.shadows);
    }
    castShadows(light) {
        if (!LightingConfig.shadowsEnabled) return;

        const cellX = Math.floor(light.x / this.cellSize);
        const cellY = Math.floor(light.y / this.cellSize);
        const cellRadius = Math.ceil(light.radius / this.cellSize);

        for (let y = cellY - cellRadius; y <= cellY + cellRadius; y++) {
            for (let x = cellX - cellRadius; x <= cellX + cellRadius; x++) {
                if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;

                const dx = x - cellX;
                const dy = y - cellY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= cellRadius && distance > 1) {
                    const angle = Math.atan2(dy, dx);
                    const rayLength = distance * this.cellSize;

                    let blocked = false;
                    let shadowIntensity = 0;
                    for (let i = 1; i <= rayLength; i += this.cellSize) {
                        const rayX = Math.floor((light.x + Math.cos(angle) * i) / this.cellSize);
                        const rayY = Math.floor((light.y + Math.sin(angle) * i) / this.cellSize);

                        if (rayX < 0 || rayX >= this.width || rayY < 0 || rayY >= this.height) {
                            blocked = true;
                            break;
                        }

                        if (this.shadowMap[rayY][rayX] === 1) {
                            const objectHeight = this.getObjectHeight(rayX, rayY);
                            const shadowLength = this.calculateShadowLength(light, i, objectHeight);
                            
                            if (i + shadowLength > rayLength) {
                                blocked = true;
                                // Calculate shadow intensity based on distance from light and object
                                shadowIntensity = (0.8 - (i / rayLength)) * LightingConfig.shadowDarkness;
                                break;
                            }
                        }
                    }

                    if (blocked) {
                        // Apply shadow falloff using the new variable
                        const falloffDistance = distance / cellRadius;
                        const falloffFactor = Math.max(0, 1 - falloffDistance * this.singlePointLightShadowFalloff);
                        shadowIntensity *= falloffFactor;

                        // Apply shadow spread
                        const spreadFactor = 1 + (distance / cellRadius) * 0.5;
                        const spreadRadius = Math.ceil(spreadFactor);

                        for (let sy = -spreadRadius; sy <= spreadRadius; sy++) {
                            for (let sx = -spreadRadius; sx <= spreadRadius; sx++) {
                                const spreadX = x + sx;
                                const spreadY = y + sy;

                                if (spreadX >= 0 && spreadX < this.width && spreadY >= 0 && spreadY < this.height) {
                                    const spreadDistance = Math.sqrt(sx * sx + sy * sy);
                                    if (spreadDistance <= spreadRadius) {
                                        const spreadIntensity = shadowIntensity * (1 - spreadDistance / spreadRadius);
                                        this.shadowMap[spreadY][spreadX] = Math.max(
                                            this.shadowMap[spreadY][spreadX],
                                            spreadIntensity * LightingConfig.shadowDarkness
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    getObjectHeight(x, y) {
        //TODO:
        // This function should return the height of the object at the given cell
        return 32;
    }
    calculateShadowLength(light, distance, objectHeight) {
        const heightDifference = objectHeight - light.height;
        if (heightDifference <= 0) return 0;

        const shadowLength = (heightDifference / light.height) * distance;
        return shadowLength;
    }
    updateShadowMap() {
        // Reset shadow map
        this.initShadowMap();

        // Update shadow map based on objects in the scene
        // For example, you can iterate through all objects that should cast shadows
        // and set their corresponding cells in the shadow map to 1
        // This is just an example, you'll need to adjust it based on your game's objects
        this.scene.enemyGroup.children.entries.forEach(enemy => {
            const cellX = Math.floor(enemy.x / this.cellSize);
            const cellY = Math.floor(enemy.y / this.cellSize);
            if (cellX >= 0 && cellX < this.width && cellY >= 0 && cellY < this.height) {
                this.shadowMap[cellY][cellX] = 1;
            }
        });
        // Add player shadow
        const playerCellX = Math.floor(this.scene.player.sprite.x / this.cellSize);
        const playerCellY = Math.floor(this.scene.player.sprite.y / this.cellSize);
        if (playerCellX >= 0 && playerCellX < this.width && playerCellY >= 0 && playerCellY < this.height) {
            this.shadowMap[playerCellY][playerCellX] = 1;
        }
        // You can add more object types here that should cast shadows
    }
    // Global Illumination.
    toggleGlobalIllumination() {
        this.globalIlluminationEnabled = !this.globalIlluminationEnabled;
    }
    setGlobalIlluminationIntensity(intensity) {
        this.globalIlluminationIntensity = Phaser.Math.Clamp(intensity, 0, 1);
    }
    setNoiseDirection(x, y) {
        this.noiseDirection.set(x, y).normalize();
    }
    setNoiseSpeed(speed) {
        this.noiseSpeed = speed;
    }
    applyGlobalIllumination() {
        if (!this.globalIlluminationEnabled) return;

        const camera = this.scene.cameras.main;
        const startCellX = Math.max(0, Math.floor(camera.scrollX / this.cellSize));
        const startCellY = Math.max(0, Math.floor(camera.scrollY / this.cellSize));
        const endCellX = Math.min(this.width - 1, Math.ceil((camera.scrollX + camera.width) / this.cellSize));
        const endCellY = Math.min(this.height - 1, Math.ceil((camera.scrollY + camera.height) / this.cellSize));

        this.noiseOffset += 0.002; // Slowly move the noise pattern

        // Extract RGB components from the global illumination color
        const r = (this.globalIlluminationColor >> 16) & 0xFF;
        const g = (this.globalIlluminationColor >> 8) & 0xFF;
        const b = this.globalIlluminationColor & 0xFF;

        for (let y = startCellY; y <= endCellY; y++) {
            for (let x = startCellX; x <= endCellX; x++) {
                const noiseValue = this.noise.simpleNoise(x * this.noiseScale + this.noiseOffset, y * this.noiseScale + this.noiseOffset);
                const normalizedNoise = (noiseValue + 1) / 2; // Normalize to 0-1 range
                const shadowIntensity = normalizedNoise * this.noiseShadowIntensity;
                
                // Apply global illumination intensity
                const illumination = (this.globalIlluminationIntensity) * (1 - shadowIntensity);

                // Apply color to global illumination, taking into account the intensity
                this.cells[y][x].r = Math.min(1, this.cells[y][x].r + illumination * (r / 255));
                this.cells[y][x].g = Math.min(1, this.cells[y][x].g + illumination * (g / 255));
                this.cells[y][x].b = Math.min(1, this.cells[y][x].b + illumination * (b / 255));
            }
        }
    }
    setGlobalIlluminationColor(color) {
        this.globalIlluminationColor = color;
    }
    setNoiseFrequency(frequency) {
        this.noise.setNoiseFrequency(frequency);
    }
    setNoiseAmplitude(amplitude) {
        this.noise.setNoiseAmplitude(amplitude);
    }
    setNoisePersistence(persistence) {
        this.noise.setNoisePersistence(persistence);
    }
    setNoiseOctaves(octaves) {
        this.noise.setNoiseOctaves(octaves);
    }
}
class TileManager {
    /*
        Keeps track of what is present in which tile. 

        TODO:
            Make it so that tiles are only updated when a change is made to them.
    */
    constructor(scene, tileSize) {
        this.scene = scene;
        scene.levelManager.tileSize = tileSize;
        this.tiles = new Map();
    }
    getTileKey(x, y) {
        return `${x},${y}`;
    }
    addEntity(entity, x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        const key = this.getTileKey(tileX, tileY);
        
        if (!this.tiles.has(key)) {
            this.tiles.set(key, new Set());
        }
        this.tiles.get(key).add(entity);
    }
    removeEntity(entity, x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        const key = this.getTileKey(tileX, tileY);
        
        if (this.tiles.has(key)) {
            this.tiles.get(key).delete(entity);
            if (this.tiles.get(key).size === 0) {
                this.tiles.delete(key);
            }
        }
    }
    getEntitiesAt(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        const key = this.getTileKey(tileX, tileY);
        
        return this.tiles.has(key) ? Array.from(this.tiles.get(key)) : [];
    }
    moveEntity(entity, oldX, oldY, newX, newY) {
        this.removeEntity(entity, oldX, oldY);
        this.addEntity(entity, newX, newY);
    }
    clear() {
        this.tiles.clear();
    }
    update(){
        this.moveEntity(this.scene.player, this.scene.player.sprite.x, this.scene.player.sprite.y, this.scene.player.sprite.x, this.scene.player.sprite.y);

        this.scene.enemies.forEach(enemy => {
            this.moveEntity(enemy, enemy.sprite.x, enemy.sprite.y, enemy.sprite.x, enemy.sprite.y);
        });
    }
}
class WorldTimeManager {
    constructor(scene) {
        this.scene = scene;
        this.timeScale = 1; // 1 second real time = 1 minute game time
        this.gameTime = 0; // in minutes
        this.dayLength = 24 * 60; // 24 hours in minutes
        this.startHour = 6; // Game starts at 6 AM

        // Time ranges for different periods of the day
        this.timeRanges = {
            night: { start: 0.9, end: 0.20 },    // Night is now 6 hours (25% of the day)
            sunrise: { start: 0.2, end: 0.3 }, // Sunrise is 1.2 hours
            morning: { start: 0.3, end: 0.4 },  // Morning is 2.4 hours
            noon: { start: 0.4, end: 0.6 },     // Noon is 7.2 hours
            evening: { start: 0.6, end: 0.85 },  // Evening is 3.6 hours
            sunset: { start: 0.85, end: 0.90 }   // Sunset is 1.2 hours
            // Night continues from 0.90 to 1.0 (or 0.0), which is 2.4 hours
        };

        // Colors for different times of day
        this.colours = {
            night: 0x010529,
            sunrise: 0x00225f,
            morning: 0x0ad4ec,
            noon: 0xffec89,
            evening: 0xffbb69,
            sunset: 0xfe792b
        }

        this.timeText = this.scene.add.text(10, 10, '', { 
            fontSize: '16px', 
            fontFamily: 'PixelifyRegular',
            fill: '#ffffff' 
        }).setScrollFactor(0).setDepth(Layers);

        // Create fast forward button
        this.fastForwardButton = this.scene.add.text(10, 40, 'FF', {
            fontSize: '16px',
            fontFamily: 'PixelifyRegular',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 5, y: 5 }
        }).setScrollFactor(0).setDepth(Layers.ui).setInteractive();

        this.fastForwardButton.on('pointerdown', () => {
            this.toggleFastForward();
        });

        this.isFastForward = false;
        this.normalTimeScale = 1;
        this.fastForwardTimeScale = 60; // 60x speed when fast forwarding

        this.updateTimeDisplay();
    }
    update(delta) {
        this.gameTime += (delta / 1000) * this.timeScale;
        if (this.gameTime >= this.dayLength) {
            this.gameTime -= this.dayLength;
        }
        this.updateTimeDisplay();
        this.updateLighting();
    }
    updateTimeDisplay() {
        const totalMinutes = (this.gameTime + this.startHour * 60) % this.dayLength;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);
        this.timeText.setText(`Time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        this.fastForwardButton.setBackgroundColor(this.isFastForward ? '#ff0000' : '#333333');
    }
    updateLighting() {
        const totalMinutes = (this.gameTime + this.startHour * 60) % this.dayLength;
        const normalizedTime = totalMinutes / this.dayLength;

        let currentPeriod, nextPeriod, t;
        for (const [period, range] of Object.entries(this.timeRanges)) {
            if (normalizedTime >= range.start && normalizedTime < range.end) {
                currentPeriod = period;
                nextPeriod = this.getNextPeriod(period);
                t = (normalizedTime - range.start) / (range.end - range.start);
                break;
            }
        }
        // Handle night period separately as it wraps around
        if (!currentPeriod) {
            currentPeriod = 'night';
            nextPeriod = 'sunrise';
            if (normalizedTime >= this.timeRanges.sunset.end) {
                t = (normalizedTime - this.timeRanges.sunset.end) / (1 - this.timeRanges.sunset.end + this.timeRanges.sunrise.start);
            } else {
                t = (normalizedTime + 1 - this.timeRanges.sunset.end) / (1 - this.timeRanges.sunset.end + this.timeRanges.sunrise.start);
            }
        }
        // Calculate lighting parameters based on current period
        let sunIntensity, globalIlluminationIntensity, shadowLength, shadowFadeIntensity;
        switch (currentPeriod) {
            case 'night':
                sunIntensity = Phaser.Math.Linear(0.6, 0, t);
                globalIlluminationIntensity = Phaser.Math.Linear(0.6, 0.1, t);
                break;
                
            case 'sunrise':
                shadowLength = 12;
                shadowFadeIntensity = 0.1;

                sunIntensity = Phaser.Math.Linear(0, 0.4, t);
                globalIlluminationIntensity = Phaser.Math.Linear(0.1, 0.4, t);
                break;

            case 'morning':
                shadowLength = Phaser.Math.Linear(12, 10, t);
                shadowFadeIntensity = 0.15;

                sunIntensity = Phaser.Math.Linear(0.4, 0.6, t);
                globalIlluminationIntensity = Phaser.Math.Linear(0.4, 0.8, t);
                break;

            case 'noon':
                shadowLength = Phaser.Math.Linear(10, 1, t);
                shadowFadeIntensity = Phaser.Math.Linear(0.15, 0.3, t);

                sunIntensity = Phaser.Math.Linear(0.6, 1, t);
                globalIlluminationIntensity = Phaser.Math.Linear(0.8, 1, t);
                break;

            case 'evening':
                shadowLength = Phaser.Math.Linear(1, 10, t);
                shadowFadeIntensity = Phaser.Math.Linear(0.3, 0.15, t);

                sunIntensity = Phaser.Math.Linear(1, 0.6, t);
                globalIlluminationIntensity = Phaser.Math.Linear(0.8, 0.6, t);
                break;
            case 'sunset':
                shadowLength = Phaser.Math.Linear(40, 0, t);
                shadowFadeIntensity = Phaser.Math.Linear(0.1, 0.8, t);

                sunIntensity = Phaser.Math.Linear(0.6, 0, t);
                globalIlluminationIntensity = Phaser.Math.Linear(0.6, 0.1, t);
                break;


           

        }
        // Calculate global illumination color
        const startColor = Phaser.Display.Color.ValueToColor(this.colours[currentPeriod]);
        const endColor = Phaser.Display.Color.ValueToColor(this.colours[nextPeriod]);
        const globalIlluminationColor = Phaser.Display.Color.Interpolate.ColorWithColor(
            startColor,
            endColor,
            100,
            t * 100
        );
        // Update lighting system
        if (this.scene.lightingSystem) {
            this.scene.lightingSystem.setSunIntensity(sunIntensity);
            this.scene.lightingSystem.sunShadowLength = shadowLength;
            this.scene.lightingSystem.sunShadowFalloff = shadowFadeIntensity;
            this.scene.lightingSystem.setGlobalIlluminationIntensity(globalIlluminationIntensity);
            this.scene.lightingSystem.setGlobalIlluminationColor(Phaser.Display.Color.GetColor(
                globalIlluminationColor.r,
                globalIlluminationColor.g,
                globalIlluminationColor.b
            ));

            // Change sun direction based on time
            const sunAngle = (normalizedTime * Math.PI * 2) - Math.PI / 2;
            this.scene.lightingSystem.setSunDirection(Math.cos(sunAngle), Math.sin(sunAngle));
        }
    }
    getNextPeriod(currentPeriod) {
        const periods = Object.keys(this.timeRanges);
        const currentIndex = periods.indexOf(currentPeriod);
        return periods[(currentIndex + 1) % periods.length];
    }
    setTimeScale(scale) {
        this.timeScale = scale;
    }
    getCurrentHour() {
        return Math.floor(((this.gameTime / 60) + this.startHour) % 24);
    }
    toggleFastForward() {
        this.isFastForward = !this.isFastForward;
        this.timeScale = this.isFastForward ? this.fastForwardTimeScale : this.normalTimeScale;
        this.updateTimeDisplay();
    }
    // Method to set custom time ranges
    setTimeRanges(newRanges) {
        // Validate and set new time ranges
        for (const [period, range] of Object.entries(newRanges)) {
            if (this.timeRanges.hasOwnProperty(period) && 
                range.hasOwnProperty('start') && 
                range.hasOwnProperty('end') &&
                range.start >= 0 && range.start < 1 &&
                range.end > 0 && range.end <= 1 &&
                range.start < range.end) {
                this.timeRanges[period] = range;
            } else {
                console.error(`Invalid time range for ${period}`);
            }
        }
    }
}
class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.rainDrops = [];
        this.maxRainDrops = 200;
        this.rainIntensity = 1;
        this.isRaining = false;
        this.rainDropPool = [];
        this.rainSpawnTimer = 0;
        this.rainSpawnInterval = 50; // Spawn a new raindrop every 50ms
        this.rainSpawnHeight = 40; // Spawn height above camera bounds
        this.minFallDistance = 100; // Minimum fall distance
        this.maxFallDistance = 200; // Maximum fall distance
        this.rainFallSpeed = 500; // Default rain fall speed (pixels per second)

        // Wind properties
        this.windDirection = new Phaser.Math.Vector2(1, 0); // Default wind direction: right
        this.baseWindStrength = 0; // Base wind strength
        this.windStrength = this.baseWindStrength; // Current wind strength
        this.windVariance = 0.2; // Default wind variance (random influence range)
        this.windBuildupTime = 500; // Time (in ms) for wind to reach full strength

        // Gust properties
        this.gustsEnabled = true;
        this.gustTimer = 0;
        this.gustInterval = Phaser.Math.Between(5000, 15000); // Time between gusts (5-15 seconds)
        this.gustDuration = 2000; // Duration of a gust (2 seconds)
        this.gustStrength = 1.5; // Maximum additional strength during a gust
        this.isGusting = false;
        this.gustProgress = 0;
    }
    createRainDrop() {
        let raindrop;
        if (this.rainDropPool.length > 0) {
            raindrop = this.rainDropPool.pop();
            raindrop.setActive(true).setVisible(true);
        } else {
            raindrop = this.scene.add.graphics();
            raindrop.fillStyle(0x084eff, 1);
            raindrop.fillRect(0, 0, 2, 2); // Make raindrops thinner
            raindrop.setDepth(Layers.lighting + 1);
        }
        // Add wind influence property to each raindrop
        raindrop.windInfluence = Phaser.Math.FloatBetween(-this.windVariance, this.windVariance);
        raindrop.timeSinceSpawn = 0; // New property to track time since spawn
        return raindrop;
    }
    startRain(intensity = 1) {
        this.isRaining = true;
        this.rainIntensity = intensity;
    }
    stopRain() {
        this.isRaining = false;
        this.rainDrops.forEach(drop => {
            drop.setActive(false).setVisible(false);
            this.rainDropPool.push(drop);
        });
        this.rainDrops = [];
    }
    resetRainDrop(drop) {
        const camera = this.scene.cameras.main;
        drop.x = Phaser.Math.Between(camera.scrollX - 50, camera.scrollX + camera.width + 50);
        drop.y = camera.scrollY - this.rainSpawnHeight;
        drop.alpha = Phaser.Math.FloatBetween(0.3, 0.7);
        drop.fallDistance = Phaser.Math.Between(this.minFallDistance, this.maxFallDistance);
        // Reset wind influence
        drop.windInfluence = Phaser.Math.FloatBetween(-this.windVariance, this.windVariance);
        drop.timeSinceSpawn = 0; // Reset time since spawn
    }
    update(delta) {
        if (!this.isRaining) return;

        const camera = this.scene.cameras.main;
        const speed = this.rainFallSpeed * (delta / 1000);

        // Update wind and gusts
        this.updateWind(delta);

        // Spawn new raindrops consistently
        this.rainSpawnTimer += delta;
        while (this.rainSpawnTimer >= this.rainSpawnInterval && this.rainDrops.length < this.maxRainDrops * this.rainIntensity) {
            const drop = this.createRainDrop();
            this.resetRainDrop(drop);
            this.rainDrops.push(drop);
            this.rainSpawnTimer -= this.rainSpawnInterval;
        }

        // Update existing raindrops
        for (let i = this.rainDrops.length - 1; i >= 0; i--) {
            const drop = this.rainDrops[i];
            drop.y += speed;
            drop.timeSinceSpawn += delta;
            
            // Calculate wind effect based on time since spawn
            const windFactor = Math.min(drop.timeSinceSpawn / this.windBuildupTime, 1);
            const windEffect = this.windDirection.clone().scale((this.windStrength + drop.windInfluence) * windFactor);
            drop.x += windEffect.x * speed;
            drop.y += windEffect.y * speed;

            if (drop.y > camera.scrollY + camera.height + drop.fallDistance) {
                this.resetRainDrop(drop);
            }
        }
    }
    updateWind(delta) {
        // Update gust timer
        this.gustTimer += delta;

        if (this.gustsEnabled && this.isGusting) {
            // Update gust progress
            this.gustProgress += delta / this.gustDuration;
            if (this.gustProgress >= 1) {
                // End of gust
                this.isGusting = false;
                this.gustProgress = 0;
                this.gustTimer = 0;
                this.windStrength = this.baseWindStrength;
            } else {
                // During gust, use a sine wave to simulate the gust intensity
                const gustIntensity = Math.sin(this.gustProgress * Math.PI);
                this.windStrength = this.baseWindStrength + (this.gustStrength * gustIntensity);
            }
        } else if (this.gustsEnabled && this.gustTimer >= this.gustInterval) {
            // Start a new gust
            this.isGusting = true;
            this.gustProgress = 0;
            this.gustInterval = Phaser.Math.Between(5000, 15000); // Set next gust interval
        }

        // Optionally, you can add some small random fluctuations to the base wind strength
        if (!this.isGusting) {
            this.windStrength = this.baseWindStrength + (Math.random() * 0.1 - 0.05);
        }
    }
    setWindDirection(x, y) {
        this.windDirection.set(x, y).normalize();
    }
    setBaseWindStrength(strength) {
        this.baseWindStrength = strength;
    }
    setWindVariance(variance) {
        this.windVariance = variance;
    }
    setWindBuildupTime(time) {
        this.windBuildupTime = time;
    }
    setGustParameters(interval, duration, strength) {
        this.gustInterval = interval;
        this.gustDuration = duration;
        this.gustStrength = strength;
    }
    setGustsEnabled(enabled) {
        this.gustsEnabled = enabled;
        if (!enabled) {
            this.isGusting = false;
            this.gustProgress = 0;
            this.gustTimer = 0;
            this.windStrength = this.baseWindStrength;
        }
    }
    setRainFallSpeed(speed) {
        this.rainFallSpeed = speed;
    }
}

//########################################################################################################################################################################################################################################################
// ++ ENTITIES ++ 
//########################################################################################################################################################################################################################################################
class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.tileSize = GameConfig.tileSize;
        
        // Adjust initial position to align with tile grid
        const adjustedX = Math.floor(x / this.tileSize) * this.tileSize + this.tileSize / 2;
        const adjustedY = Math.floor(y / this.tileSize) * this.tileSize + this.tileSize / 2;
        
        this.sprite = scene.physics.add.sprite(adjustedX, adjustedY, 'player').setDepth(Layers.player);
        this.sprite.setCollideWorldBounds(false);
        this.sprite.setVisible(true);
        this.driverSprite = scene.add.sprite(adjustedX, adjustedY, 'HandDriver').setDepth(Layers.player);
        this.driverSprite.setVisible(true);
        this.rightHand = scene.add.sprite(adjustedX, adjustedY, 'Sword1');
        this.rightHand.setOrigin(2/5, 0.9);
        this.leftHand = scene.add.sprite(adjustedX, adjustedY, 'Sword1');
        this.leftHand.setOrigin(2/5, 0.9);
        
        this.sprite.setOrigin(0.5, 1);
        this.driverSprite.setOrigin(0.5, 1);

        this.invulnerable = false;
        this.casting = false;

        this.level = 1;
        this.exp = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 50;
        this.maxMana = 50;
        this.strength = 10;
        this.dexterity = 10;
        this.defence = 10;
        this.intelligence = 10;
        this.inventory = new Inventory(20);

        this.sprite.body.enable = false;

        // Add the movement component
        this.movementComponent = new MovementComponent(scene, this.sprite, this.tileSize, 80, true);
        this.combatComponent = new CombatComponent(this);

        this.attackRange = 32; // Attack range in pixels
        this.attackCooldown = 1000; // Attack cooldown in milliseconds
        this.lastAttackTime = 0;
        this.targetEnemy = null;

    }
    getHandPositions() {
        // ... (unchanged)
    }
    update(time, delta) {
        this.movementComponent.update(time, delta);
        
        // Align driver sprite and hands to tile grid
        const alignedX = Math.floor(this.sprite.x / this.tileSize) * this.tileSize + this.tileSize / 2;
        const alignedY = Math.floor(this.sprite.y / this.tileSize) * this.tileSize + this.tileSize / 2;
        
        this.driverSprite.x = alignedX;
        this.driverSprite.y = alignedY;
        this.updateHandPositions();

        if (!this.movementComponent.getIsMoving()) {
            this.playIdleAnimation();
        } else {
            this.updateAnimation();
        }

        // Check if we have a target enemy and are in range to attack
        if (this.targetEnemy) {
            const distance = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                this.targetEnemy.sprite.x, this.targetEnemy.sprite.y
            );

            if (distance <= this.attackRange) {
                this.attackEnemy(time);
            }
        }
    }
    attackEnemy(time) {
        if (time - this.lastAttackTime >= this.attackCooldown) {
            this.combatComponent.attack(this.targetEnemy);
            this.lastAttackTime = time;
            console.log("Player attacks enemy!");
        }
    }
    setTargetEnemy(enemy) {
        this.targetEnemy = enemy;
    }
    updateAnimation(angle) {
        this.sprite.anims.play(`run_${this.movementComponent.heading}`, true);
        this.driverSprite.anims.play(`RH_run_${this.movementComponent.heading}`, true);
    }
    playIdleAnimation() {
        this.sprite.anims.play(`idle_${this.movementComponent.heading}`, true);
        this.driverSprite.anims.play(`RH_idle_${this.movementComponent.heading}`, true);
    }
    getDirectionFromAngle(angle) {
        const octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;
        return ['right', 'down', 'down', 'down', 'left', 'up', 'up', 'up'][octant];
    }
    updateHandPositions() {
        const handPositions = this.getHandPositions();
        if (handPositions) {
            let leftEdgeX = this.sprite.x - (this.sprite.width * this.sprite.originX);
            let leftEdgeY = this.sprite.y - (this.sprite.height * this.sprite.originY);
            
            if (handPositions.right) {
                this.rightHand.setPosition(leftEdgeX + handPositions.right.x, leftEdgeY + handPositions.right.y);
            }
            if (handPositions.left) {
                this.leftHand.setPosition(leftEdgeX + handPositions.left.x, leftEdgeY + handPositions.left.y);
            }
        }
    }
    moveTo(tileX, tileY) {
        // Adjust the target position to the center of the tile
        const adjustedX = tileX * this.tileSize + this.tileSize / 2;
        const adjustedY = tileY * this.tileSize + this.tileSize / 2;
        
        // Calculate the path using A*
        const path = this.scene.astar.findPath(
            this.sprite.x,
            this.sprite.y,
            adjustedX,
            adjustedY
        );

        // Adjust the path to align with tile centers
        const adjustedPath = path ? path.map(point => ({
            x: Math.floor(point.x / this.tileSize) * this.tileSize + this.tileSize / 2,
            y: Math.floor(point.y / this.tileSize) * this.tileSize + this.tileSize / 2
        })) : null;
        
        if (adjustedPath && adjustedPath.length > 0) {
            this.movementComponent.moveTo(adjustedX, adjustedY, adjustedPath);
        } else {
            console.log("No valid path found");
        }
    }
}
class Enemy {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.sprite.setCollideWorldBounds(true);
        this.movementComponent = new MovementComponent(scene, this.sprite, GameConfig.tileSize, 50, false);
        this.sprite.setDepth(3);
        this.sprite.setOrigin(0.5, 1);

        // Wander mechanic properties
        this.wanderRadius = 5 * GameConfig.tileSize;
        this.wanderInterval = Phaser.Math.Between(3000, 8000);
        this.lastWanderTime = 0;

        // Stats.
        this.heath = 100;
        this.maxHealth = 100;
        this.defence = 10; 
        this.combatComponent = new CombatComponent(this);


        console.log("Enemy created at", x, y);
    }
    update(time, delta) {
        this.movementComponent.update(time, delta);

        if (time > this.lastWanderTime + this.wanderInterval) {
            this.wander();
            this.lastWanderTime = time;
            this.wanderInterval = Phaser.Math.Between(3000, 8000);
        }
    }
    wander() {
        const currentX = this.sprite.x;
        const currentY = this.sprite.y;

        let targetX, targetY;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.wanderRadius;
            targetX = currentX + Math.cos(angle) * distance;
            targetY = currentY + Math.sin(angle) * distance;

            // Clamp the target position to the world bounds
            const worldBounds = this.scene.physics.world.bounds;
            targetX = Phaser.Math.Clamp(targetX, worldBounds.x + GameConfig.tileSize, worldBounds.x + worldBounds.width - GameConfig.tileSize);
            targetY = Phaser.Math.Clamp(targetY, worldBounds.y + GameConfig.tileSize, worldBounds.y + worldBounds.height - GameConfig.tileSize);

            attempts++;
        } while (!this.isValidPosition(targetX, targetY) && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            console.log("Enemy couldn't find a valid wander position after max attempts");
            return;
        }

        const tileX = Math.floor(targetX / GameConfig.tileSize);
        const tileY = Math.floor(targetY / GameConfig.tileSize);

        const path = this.scene.astar.findPath(
            currentX,
            currentY,
            tileX * GameConfig.tileSize + GameConfig.tileSize / 2,
            tileY * GameConfig.tileSize + GameConfig.tileSize / 2
        );

        if (path && path.length > 0) {
            this.movementComponent.moveTo(
                tileX * GameConfig.tileSize + GameConfig.tileSize / 2, 
                tileY * GameConfig.tileSize + GameConfig.tileSize / 2, 
                path
            );
        } else {
            console.log("Enemy couldn't find path, staying in place");
        }
    }
    isValidPosition(x, y) {
        const tileX = Math.floor(x / GameConfig.tileSize);
        const tileY = Math.floor(y / GameConfig.tileSize);
        const grid = this.scene.astar.createGrid();
        return this.scene.astar.isValidTile(tileX, tileY, grid);
    }
    moveTo(tileX, tileY, path) {
        this.movementComponent.moveTo(tileX, tileY, path);
    }
    destroy() {
        this.movementComponent.destroy();
        this.sprite.destroy();
    }
}


//#####################################################################################################################################################
// ++ JOURNAL AND PANELS ++ 
//#####################################################################################################################################################
class Journal extends Phaser.Scene {
    constructor() {
        super({ key: 'journal' });
        this.currentPage = 'hero';
        this.pages = {
            quests: { title1: 'Quest Log', title2: 'Achievements', id: 'quest' },
            hero: { title1: 'Hero Panel', title2: 'Inventory', id: 'hero' },
            talents: { title1: 'Talents', title2: 'Skills', id: 'talent' },
            map: { title1: 'Level Map', title2: 'Area Info', id: 'map' },
            settings: { title1: 'Settings', title2: 'Options', id: 'settings' }
        };

        this.bookLayer = null;
        this.page1Layer = null;
        this.page2Layer = null;
        this.heroInfoPanel = null;
        this.inventoryPanel = null;
        this.settingsPanel = null;
    }
    createInputs() {
        this.input.keyboard.on('keydown-J', () => {
            this.scene.resume('game');
            this.scene.stop();
        });
        this.input.keyboard.on('keydown-LEFT', () => {
            this.flipPageLeft();
        });
        this.input.keyboard.on('keydown-RIGHT', () => {
            this.flipPageRight();
        });
        // Add 'M' key listener to open ScreenMeasure
        this.input.keyboard.on('keydown-M', () => {
            this.openScreenMeasure();
        });
    }
    createButtons() {
        this.closeButton = this.add.text(880, 20, 'Close', { fontSize: '16px', fill: '#ffffff' })
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.resume('game');
                this.scene.stop();
            });
        this.closeButton.setDepth(2);

        this.leftButton = this.add.text(journalCoords.page1.left, journalCoords.page1.bottom + 20, 'Previous', { fontSize: '16px', fill: '#ffffff' })
            .setInteractive()
            .on('pointerdown', () => this.flipPageLeft());
        this.leftButton.setDepth(2);

        this.rightButton = this.add.text(journalCoords.page2.right - 60, journalCoords.page2.bottom + 20, 'Next', { fontSize: '16px', fill: '#ffffff' })
            .setInteractive()
            .on('pointerdown', () => this.flipPageRight());
        this.rightButton.setDepth(2);
        this.bookLayer.add([this.bookAnimation, this.leftButton, this.rightButton, this.closeButton]);
    }
    create(data) {
        this.player = data.player;
        this.bookLayer = this.add.layer();
        this.page1Layer = this.add.layer();
        this.page2Layer = this.add.layer();

        this.bookAnimation = this.add.sprite(config.width / 2, config.height / 2, 'BookAnimation').setOrigin(0.5);
        this.bookAnimation.setDepth(1);

        this.titleText1 = this.add.text(journalCoords.page1.center, 80, 'Journal', {
            fontFamily: 'PixelifySemiBold',
            fontSize: '22px',
            fill: '#000000',
            resolution: 1
        }).setOrigin(0.5);
        this.titleText1.setDepth(2);
        this.page1Layer.add(this.titleText1);

        this.titleText2 = this.add.text(journalCoords.page2.center, 80, 'Journal', {
            fontFamily: 'PixelifySemiBold',
            fontSize: '22px',
            fill: '#000000'
        }).setOrigin(0.5);
        this.titleText2.setDepth(2);
        this.page2Layer.add(this.titleText2);

        this.createInputs();
        this.createButtons();

        this.heroInfoPanel = new HeroInfoPanel(this, journalCoords.page1.center, 200);
        this.page1Layer.add(this.heroInfoPanel.container);

        this.inventoryPanel = new InventoryPanel(this, journalCoords.page2.center, 200);
        this.page2Layer.add(this.inventoryPanel.container);

        this.settingsPanel = new SettingsPanel(this, 14 +journalCoords.page1.left, 300);
        this.page1Layer.add(this.settingsPanel.container);

        this.loadPage(this.currentPage);
    }
    loadPage(page) {
        this.heroInfoPanel.setVisible(false);
        this.inventoryPanel.setVisible(false);
        this.settingsPanel.setVisible(false);
        this.titleText1.setText(this.pages[this.currentPage].title1);
        this.titleText2.setText(this.pages[this.currentPage].title2);
        switch (page) {
            case 'hero':
                this.heroInfoPanel.setVisible(true);
                this.heroInfoPanel.updateInfo(this.player);
                this.inventoryPanel.setVisible(true);
                this.inventoryPanel.updateInventory(this.player.inventory);
                break;
            case 'quests':
                // Load quests page
                break; 
            case 'talents':
                // Load talents page
                break;
            case 'map':
                // Load map page
                break;
            case 'settings':
                this.settingsPanel.setVisible(true);
                this.settingsPanel.updateSettings({
                    difficulty: 'Normal',
                    soundVolume: '80%',
                    musicVolume: '70%',
                    resolution: '1920x1080',
                    quality: 'High',
                    fullscreen: true
                });
                break;
            default:
                console.log('Unknown page:', page);
        }
    }
    flipPageLeft() {
        this.bookAnimation.play('book_flip_left');
        this.bookAnimation.on('animationupdate', (animation, frame) => {
            if (frame.index === 2) {
                this.page1Layer.setVisible(false);
                this.page2Layer.setVisible(false);
            }
            if (frame.index === animation.frames.length - 3) {
                this.page1Layer.setVisible(true);
                this.page2Layer.setVisible(true);
                const pageKeys = Object.keys(this.pages);
                const currentIndex = pageKeys.indexOf(this.currentPage);
                this.currentPage = pageKeys[(currentIndex - 1 + pageKeys.length) % pageKeys.length];
                this.loadPage(this.currentPage);
                this.bookAnimation.off('animationupdate');
            }
        });
    }
    flipPageRight() {
        this.bookAnimation.play('book_flip_right');
        this.bookAnimation.on('animationupdate', (animation, frame) => {
            if (frame.index === 4) {
                this.page1Layer.setVisible(false);
                this.page2Layer.setVisible(false);
            }
            if (frame.index === animation.frames.length - 3) {
                this.page1Layer.setVisible(true);
                this.page2Layer.setVisible(true);
                const pageKeys = Object.keys(this.pages);
                const currentIndex = pageKeys.indexOf(this.currentPage);
                this.currentPage = pageKeys[(currentIndex + 1) % pageKeys.length];
                this.loadPage(this.currentPage);
                this.bookAnimation.off('animationupdate');
            }
        });
    }
    openScreenMeasure() {
        this.scene.launch('screenMeasure', { launchedFrom: 'journal' });
        this.scene.bringToTop('screenMeasure');
        this.scene.pause();
    }
}
class InventoryPanel {
   // Convert to Scene later.
   
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.visible = false;
        this.itemSlots = [];
        this.createPanel();
    }
    createPanel() {
        this.container = this.scene.add.container(this.x, this.y);
        
        const slotSize = 16;
        const padding = 5;
        const columns = 5;
        const rows = 6;
        const num_of_slots = columns * rows;

        // Calculate total width and height including padding
        const totalWidth = columns * slotSize + (columns - 1) * padding;
        const totalHeight = rows * slotSize + (rows - 1) * padding;

        const startX = -totalWidth / 2;
        const startY = -totalHeight / 2;

        for (let i = 0; i < num_of_slots; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);
            const x = startX + col * (slotSize + padding);
            const y = startY + row * (slotSize + padding);

            const slot = this.scene.add.rectangle(x, y, slotSize, slotSize, 0xcccccc);
            slot.setStrokeStyle(1, 0x000000);
            this.itemSlots.push(slot);
            this.container.add(slot);
        }

        this.container.setDepth(3);
    }
    updateInventory(inventory) {
        // Clear existing item texts
        this.container.each(child => {
            if (child.type === 'Text') {
                child.destroy();
            }
        });

        inventory.items.forEach((item, index) => {
            if (item) {
                const slot = this.itemSlots[index];
                const text = this.scene.add.text(
                    slot.x,
                    slot.y,
                    item.name[0], // Display first letter of item name
                    { fontSize: '16px', fill: '#000000' }
                ).setOrigin(0.5);
                this.container.add(text);
            }
        });
    }
    setVisible(visible) {
        this.visible = visible;
        this.container.setVisible(visible);
    }
}
class SettingsPanel {
    // Convert to Scene later.
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.visible = false;
        this.currentTab = 'game';
        this.createPanel();
    }
    createPanel() {
        this.container = this.scene.add.container(this.x, this.y);

        // Adjust the position to be within the page bounds
        const bounds = journalCoords.page1.bounds;
        const panelWidth = bounds.width;
        const panelHeight = bounds.height;

        // Create tabs
        const tabY = -panelHeight / 2 + 20;
        this.gameTab = this.createTab('Game',  (-panelWidth / 4) + journalCoords.page1.left, tabY);
        this.graphicsTab = this.createTab('Graphics', journalCoords.page1.left, tabY);
        this.audioTab = this.createTab('Audio', (panelWidth / 4) + journalCoords.page1.left, tabY);

        // Create underlines for tabs
        this.gameUnderline = this.createUnderline((-panelWidth / 4) + journalCoords.page1.left, tabY);
        this.graphicsUnderline = this.createUnderline(journalCoords.page1.left, tabY);
        this.audioUnderline = this.createUnderline((panelWidth / 4) + journalCoords.page1.left, tabY);

        // Create content areas
        const contentY = tabY + 40;
        this.gameContent = this.createContent('Game Settings Content', journalCoords.page1.left, contentY);
        this.graphicsContent = this.createContent('Graphics Settings Content', journalCoords.page1.left, contentY);
        this.audioContent = this.createAudioContent(journalCoords.page1.left, contentY);

        this.container.add([this.gameTab, this.graphicsTab, this.audioTab, 
                            this.gameUnderline, this.graphicsUnderline, this.audioUnderline,
                            this.gameContent, this.graphicsContent, this.audioContent]);

        this.showTab('game');
        this.container.setDepth(3);
    }
    createTab(text, x, y) {
        const tab = this.scene.add.text(x, y, text, { 
            fontSize: '16px', 
            fontFamily: 'PixelifyRegular', 
            fill: '#000000',
            resolution: 1 
        })
            .setInteractive()
            .on('pointerdown', () => this.showTab(text.toLowerCase()));
        tab.setOrigin(0.5);
        return tab;
    }
    createUnderline(x, y) {
        const underline = this.scene.add.graphics();
        underline.lineStyle(2, 0xff0000);
        underline.lineBetween(x - 30, y + 15, x + 30, y + 15);
        underline.setVisible(false);
        return underline;
    }
    createContent(text, x, y) {
        const content = this.scene.add.text(x, y, text, { 
            fontSize: '14px', 
            fontFamily: 'PixelifyRegular',
            fill: '#000000', 
            wordWrap: { width: journalCoords.page1.bounds.width - 40 },
            align: 'center',
        });
        content.setOrigin(0.5, 0);
        return content;
    }
    createAudioContent(x, y) {
        const container = this.scene.add.container(x, y);

        const title = this.scene.add.text(10, 0, 'Audio Settings', {
            fontSize: '18px',
            fontFamily: 'PixelifyRegular',
            fill: '#000000',
            align: 'center',
        }).setOrigin(0.5, 0);

        const soundVolumeText = this.scene.add.text(0, 40, 'Sound Volume:', {
            fontSize: '14px',
            fontFamily: 'PixelifyRegular',
            fill: '#000000',
        }).setOrigin(0, 0.5);

        this.soundVolumeSlider = this.scene.add.rectangle(100, 40, 100, 10, 0xcccccc)
            .setOrigin(0, 0.5)
            .setInteractive();
        this.soundVolumeHandle = this.scene.add.rectangle(100, 40, 10, 20, 0x666666)
            .setOrigin(0.5, 0.5)
            .setInteractive()
            .setDepth(1);

        const musicVolumeText = this.scene.add.text(0, 80, 'Music Volume:', {
            fontSize: '14px',
            fontFamily: 'PixelifyRegular',
            fill: '#000000',
        }).setOrigin(0, 0.5);

        this.musicVolumeSlider = this.scene.add.rectangle(100, 80, 100, 10, 0xcccccc)
            .setOrigin(0, 0.5)
            .setInteractive();
        this.musicVolumeHandle = this.scene.add.rectangle(100, 80, 10, 20, 0x666666)
            .setOrigin(0.5, 0.5)
            .setInteractive()
            .setDepth(1);

        const muteText = this.scene.add.text(0, 120, 'Mute Audio:', {
            fontSize: '14px',
            fontFamily: 'PixelifyRegular',
            fill: '#000000',
        }).setOrigin(0, 0.5);

        this.muteCheckbox = this.scene.add.rectangle(100, 120, 20, 20, 0xcccccc)
            .setOrigin(0, 0.5)
            .setInteractive();
        this.muteCheckmark = this.scene.add.text(this.muteCheckbox.x +5, 120, '✓', {
            fontSize: '16px',
            fontFamily: 'PixelifyRegular',
            fill: '#000000',
        }).setOrigin(0, 0.5)
        .setVisible(false);

        container.add([title, soundVolumeText, this.soundVolumeSlider, this.soundVolumeHandle,
                       musicVolumeText, this.musicVolumeSlider, this.musicVolumeHandle,
                       muteText, this.muteCheckbox, this.muteCheckmark]);

        this.setupAudioControls();

        return container;
    }
    setupAudioControls() {
        // Sound volume control
        this.soundVolumeSlider.on('pointerdown', (pointer) => {
            this.updateVolumeSlider(this.soundVolumeSlider, this.soundVolumeHandle, pointer, 'sound');
        });

        this.soundVolumeHandle.on('pointerdown', () => {
            this.scene.input.on('pointermove', (pointer) => {
                this.updateVolumeSlider(this.soundVolumeSlider, this.soundVolumeHandle, pointer, 'sound');
            });
        });

        // Music volume control
        this.musicVolumeSlider.on('pointerdown', (pointer) => {
            this.updateVolumeSlider(this.musicVolumeSlider, this.musicVolumeHandle, pointer, 'music');
        });

        this.musicVolumeHandle.on('pointerdown', () => {
            this.scene.input.on('pointermove', (pointer) => {
                this.updateVolumeSlider(this.musicVolumeSlider, this.musicVolumeHandle, pointer, 'music');
            });
        });

        // Mute checkbox control
        this.muteCheckbox.on('pointerdown', () => {
            Settings.audio.muted = !Settings.audio.muted;
            this.muteCheckmark.setVisible(Settings.audio.muted);
            this.applyAudioSettings();
        });

        this.scene.input.on('pointerup', () => {
            this.scene.input.off('pointermove');
        });
    }
    updateVolumeSlider(slider, handle, pointer, type) {
        const localX = pointer.x - slider.x - this.container.x - this.audioContent.x;
        const newX = Phaser.Math.Clamp(localX, 0, slider.width);
        handle.x = slider.x + newX;
        const volume = Math.round((newX / slider.width) * 100);
        Settings.audio[type + 'Volume'] = volume;
        this.applyAudioSettings();
    }
    applyAudioSettings() {
        // Apply audio settings to the game
        if (this.scene.sound) {
            this.scene.sound.mute = Settings.audio.muted;
            this.scene.sound.setVolume(Settings.audio.muted ? 0 : Settings.audio.soundVolume / 100);
            // If you have separate control for music, you would set it here
            // this.scene.sound.setMusicVolume(Settings.audio.muted ? 0 : Settings.audio.musicVolume / 100);
        }
    }
    showTab(tabName) {
        this.currentTab = tabName;
        this.gameContent.setVisible(tabName === 'game');
        this.graphicsContent.setVisible(tabName === 'graphics');
        this.audioContent.setVisible(tabName === 'audio');

        // Update tab styles and underlines
        this.updateTabStyle(this.gameTab, this.gameUnderline, tabName === 'game');
        this.updateTabStyle(this.graphicsTab, this.graphicsUnderline, tabName === 'graphics');
        this.updateTabStyle(this.audioTab, this.audioUnderline, tabName === 'audio');
    }
    updateTabStyle(tab, underline, isActive) {
        tab.setColor(isActive ? '#ff0000' : '#000000');
        underline.setVisible(isActive);
    }
    setVisible(visible) {
        this.visible = visible;
        this.container.setVisible(visible);
    }
    updateSettings(settings) {
        // Provide default values for missing properties
        const defaultSettings = {
            difficulty: 'Normal',
            damageVisible: true,
            healingVisible: true,
            ememyHealthBars: true,
            playerHealthBar: true,
            graphics: {
                quality: 'Medium',
                lightCellSize: 8,
                fullscreen: false
            },
            audio: {
                soundVolume: 50,
                musicVolume: 50,
                muted: false
            }
        };

        // Merge provided settings with default settings
        const mergedSettings = {
            ...defaultSettings,
            ...settings,
            graphics: { ...defaultSettings.graphics, ...settings.graphics },
            audio: { ...defaultSettings.audio, ...settings.audio }
        };

        // Update game settings
        this.gameContent.setText(
            'Game Settings:\n\n' +
            `Difficulty: ${mergedSettings.difficulty}\n` +
            `Damage Visible: ${mergedSettings.damageVisible ? 'On' : 'Off'}\n` +
            `Healing Visible: ${mergedSettings.healingVisible ? 'On' : 'Off'}\n` +
            `Enemy Health Bars: ${mergedSettings.ememyHealthBars ? 'On' : 'Off'}\n` +
            `Player Health Bar: ${mergedSettings.playerHealthBar ? 'On' : 'Off'}`
        );

        // Update graphics settings
        this.graphicsContent.setText(
            'Graphics Settings:\n\n' +
            `Quality: ${mergedSettings.graphics.quality}\n` +
            `Light Cell Size: ${mergedSettings.graphics.lightCellSize}\n` +
            `Fullscreen: ${mergedSettings.graphics.fullscreen ? 'On' : 'Off'}`
        );

        // Update audio settings
        this.soundVolumeHandle.x = this.soundVolumeSlider.x + (mergedSettings.audio.soundVolume / 100) * this.soundVolumeSlider.width;
        this.musicVolumeHandle.x = this.musicVolumeSlider.x + (mergedSettings.audio.musicVolume / 100) * this.musicVolumeSlider.width;
        this.muteCheckmark.setVisible(mergedSettings.audio.muted);

        // Apply the audio settings
        this.applyAudioSettings();
    }
}
class HeroInfoPanel {
    // Convert to Scene later.
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.visible = false;
        this.statSpacing = 40; // New property to control stat spacing
        this.createPanel();
        this.coords = {
            profilePic : {x: 115, y: 104}
        }
    }
    createPanel() {
        this.container = this.scene.add.container(this.x, this.y);
        
        this.createStatText('Name: ', 0);
        this.createStatText('Level: ', 1);
        this.createStatText('Health: ', 2);
        this.createStatText('Mana: ', 3);
        this.createStatText('Strength: ', 4);
        this.createStatText('Dexterity: ', 5);
        this.createStatText('Intelligence: ', 6);

        this.container.setDepth(3);
    }
    createStatText(label, index) {
        const y = index * this.statSpacing;
        const text = this.scene.add.text(0, y, label, { 
            fontSize: '16px',
            fontFamily: 'PixelifyRegular', 
            fill: '#000000',
            resolution: 1 
        });

        const padding = 5;
        const border = this.scene.add.graphics();
        border.lineStyle(2, 0x000000, 1);
        border.strokeRect(
            -padding, 
            y - padding, 
            text.width + padding * 2, 
            text.height + padding * 2
        );

        this.container.add([border, text]);
        return text;
    }
    updateInfo(player) {
        const stats = [
            `Name: Player`,
            `Level: ${player.level}`,
            `Health: ${player.health}/${player.maxHealth}`,
            `Mana: ${player.mana}/${player.maxMana}`,
            `Strength: ${player.strength}`,
            `Dexterity: ${player.dexterity}`,
            `Intelligence: ${player.intelligence}`
        ];

        this.container.list.forEach((item, index) => {
            if (item.type === 'Text') {
                item.setText(stats[Math.floor(index / 2)]);
                
                // Update border size
                const border = this.container.list[index - 1];
                const padding = 5;
                border.clear();
                border.lineStyle(1, 0x000000, 1);
                border.strokeRect(
                    -padding, 
                    (Math.floor(index / 2) * this.statSpacing) - padding, 
                    item.width + padding * 2, 
                    item.height + padding * 2
                );
            }
        });
    }
    setVisible(visible) {
        this.visible = visible;
        this.container.setVisible(visible);
    }
    setStatSpacing(spacing) {
        this.statSpacing = spacing;
        this.container.list.forEach((item, index) => {
            const rowIndex = Math.floor(index / 2);
            item.y = rowIndex * this.statSpacing;
        });
    }
}


//#####################################################################################################################################################
// ++ Game Class ++
//#####################################################################################################################################################
class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'game' });
        this.keyPressed = false;
        this.gameData = new GameData();
        this.globalIlluminationEnabled = false;

        // Components
        this.levelManager = null;
        this.astar = null;
        this.tileManager = null;
        this.worldTimeManager = null;
        this.weatherSystem = null;
        this.performanceMonitor = null; // Add this line


        // New properties for noise control
        this.noiseDirectionAngle = 0;
        this.noiseSpeed = 1;

        // Tracking variables
        this.gameTime = 0;

        // Movement target indicator
        this.targetIndicator = null;

        // Mouse tile outline
        this.tileOutline = null;

        // Cell highlight thickness
        this.cellHighlightThickness = Settings.graphics.cellHighlightThickness || 2;
        this.globalIlluminationColor = 0xffffff;


        // Mouse interaction variables
        this.isLeftButtonDown = false;
        this.isRightButtonDown = false;
        this.lastClickTime = 0;
        this.doubleClickDelay = 300; // milliseconds
        this.dragStartPosition = null;
        this.isDragging = false;
        this.dragThreshold = 5; // pixels
        this.enemyGroup = null;
        this.enemies = [];

        // Camera smoothing settings.
        this.cameraFollowLerp = 0.1; // Adjust this value between 0 and 1 for different smoothing effects
        this.cameraManager = null;
    }
    init(data) {
        // Initialize data
    }
    preload() {
        this.gameData.preload(this);
        
        // Preload level data
        this.load.tilemapTiledJSON('level1', 'https://play.rosebud.ai/assets/map.tmj?nkKz');
        this.load.image('roguelikeSheet_transparent', 'https://play.rosebud.ai/assets/roguelikeSheet_transparent.png?QicF');
    }
    create() {
        // Game.
        this.gameData.create(this);
        this.frameCounter = 0;
        this.disableContextMenu();
        this.performanceMonitor = new PerformanceMonitor(this);

        // Groups.
        this.enemyGroup = this.add.group();
        
        // Player.
        this.player = new Player(this, 400, 300);
        this.player.sprite.setDepth(10);
        

        // Create Managers.
        this.createCameraManager();
        this.createLevelManager();
        this.worldTimeManager = new WorldTimeManager(this);
        const mainCamera = this.cameras.main;

        // Systems.
        this.lightingSystem = new LightingSystem(this, 3000, 2000);
        this.astar = new AStar(this);
        this.weatherSystem = new WeatherSystem(this);
        
        // Start rain for demonstration (you can toggle this with a key or based on game logic)
        this.weatherSystem.startRain(1);
        // Create the tileTtarget indicator
        this.targetIndicator = this.add.rectangle(0, 0, this.player.tileSize, this.player.tileSize, 0xff0000, 0.5);
        this.targetIndicator.setVisible(false);
        this.targetIndicator.setDepth(20); // Set depth to ensure it's above other elements

        // Create the tile outline
        this.tileOutline = this.add.graphics();
        this.tileOutline.setDepth(30); // Set depth to ensure it's above other elements

        this.keyListener();

        this.createJournal();
        this.createTileManager();
       

        this.lightingSystem.addLight(400, 300, 0.3, 200).enableFlicker();
        this.spawnEnemies(10);
        this.lightingSystem.setSunDirection(-1, 1);
        this.lightingSystem.setSunIntensity(0.7);
    }
    // Game.
    update(time, delta) {
        this.frameCounter++;
        this.gameTime += delta / 1000;


        this.lightingSystem.update(delta);
        this.player.update(time, delta);
        this.cameraManager.update();

        // Update chunks based on player position
        if (this.levelManager.currentLevel) {
            this.levelManager.updateChunks(this.player.sprite.x, this.player.sprite.y);
        }

        // Hide the target indicator if the player has reached the destination
        if (this.targetIndicator.visible) {
            const distance = Phaser.Math.Distance.Between(
                this.player.sprite.x,
                this.player.sprite.y,
                this.targetIndicator.x,
                this.targetIndicator.y
            );
            if (distance < this.player.tileSize / 2) {
                this.targetIndicator.setVisible(false);
            }
        }

        // Update cell highlight thickness if the setting has changed
        if (this.cellHighlightThickness !== Settings.graphics.cellHighlightThickness) {
            this.cellHighlightThickness = Settings.graphics.cellHighlightThickness || 2;
        }
        
        this.updateEnemies(time, delta);

        // Update TileManager with new positions
        
   
        this.tileManager.update();
        const angle = (time / 10000) % (Math.PI * 2);
        this.lightingSystem.setSunDirection(Math.cos(angle), Math.sin(angle));
        this.worldTimeManager.update(delta);
        this.weatherSystem.update(delta);
        this.performanceMonitor.update(time, delta);

    }
    toggleTimeScale() {
        this.worldTimeManager.toggleFastForward();
    }
    spawnEnemies(quantity) {
        for (let i = 0; i < quantity; i++) {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(100, 500);
            const enemy = new Enemy(this, x, y);
            this.enemies.push(enemy);
            this.enemyGroup.add(enemy.sprite);
            this.tileManager.addEntity(enemy, x, y); // Add enemy to TileManager
        }
    }
    createCameraManager(){
        this.cameras.main.setZoom(GameConfig.zoomLevel);
        this.cameraManager = new CameraManager(this, this.player);
        this.cameraManager.followPlayer();
    }
    createLevelManager(){
        this.levelManager = new LevelManager(this);
        this.levelManager.preload(); // Make sure to call preload
        this.levelManager.addLevel('level1', {
            // Add any level-specific data here
        });
        this.levelManager.loadLevel('level1'); // Load the level
        this.mapDimensions = this.levelManager.getMapDimensions();
    }
    createJournal(){
        // Wait for fonts to load before creating the journal
        this.time.delayedCall(100, () => {
            this.createJournal();
        });

    }
    createTileManager(){
        // Initialize TileManager
        this.tileManager = new TileManager(this, GameConfig.tileSize);

        // Add player to TileManager
        this.tileManager.addEntity(this.player, this.player.sprite.x, this.player.sprite.y);

        // Add enemies to TileManager
        this.enemies.forEach(enemy => {
            this.tileManager.addEntity(enemy, enemy.sprite.x, enemy.sprite.y);
        });

    }
    movePlayerToEnemy(enemy) {
        const path = this.astar.findPath(
            this.player.sprite.x,
            this.player.sprite.y,
            enemy.sprite.x,
            enemy.sprite.y
        );

        if (path && path.length > 0) {
            // Remove the last point from the path to stop one tile away from the enemy
            path.pop();

            const lastPoint = path[path.length - 1] || { x: this.player.sprite.x, y: this.player.sprite.y };
            const tileX = Math.floor(lastPoint.x / this.player.tileSize);
            const tileY = Math.floor(lastPoint.y / this.player.tileSize);

            this.player.moveTo(tileX, tileY, path);
            
            // Show and position the target indicator
            this.targetIndicator.setPosition(lastPoint.x, lastPoint.y);
            this.targetIndicator.setVisible(true);
        }
    }
    movePlayerToTile(tileX, tileY) {
        const path = this.astar.findPath(
            this.player.sprite.x,
            this.player.sprite.y,
            tileX * this.player.tileSize + this.player.tileSize / 2,
            tileY * this.player.tileSize + this.player.tileSize / 2
        );

        this.player.moveTo(tileX, tileY, path);
        
        // Show and position the target indicator
        this.targetIndicator.setPosition(
            (tileX * this.player.tileSize) + (this.player.tileSize / 2),
            (tileY * this.player.tileSize) + (this.player.tileSize / 2)
        );
        this.targetIndicator.setVisible(true);
    }
    // Keylistener related.
    keyListener() {
        // Keyboard input
        this.input.keyboard.on('keydown-G', this.toggleGlobalIllumination, this);
        this.input.keyboard.on('keydown-J', this.toggleJournal, this);
        this.input.keyboard.on('keydown-M', this.toggleScreenMeasure, this);
        this.input.keyboard.on('keydown-T', this.toggleTimeScale, this);
        this.input.keyboard.on('keydown-D', this.testDamage, this);


        // Mouse input
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.isLeftButtonDown = true;
                const currentTime = new Date().getTime();
                if (currentTime - this.lastClickTime < this.doubleClickDelay) {
                    console.log('Double click detected');
                    // Implement double click behavior here
                } else {
                    this.lastClickTime = currentTime;
                }

                // Check if an enemy was clicked
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const clickedEnemy = this.enemies.find(enemy => 
                    Phaser.Geom.Intersects.RectangleToRectangle(
                        new Phaser.Geom.Rectangle(enemy.sprite.x - enemy.sprite.width/2, enemy.sprite.y - enemy.sprite.height/2, enemy.sprite.width, enemy.sprite.height),
                        new Phaser.Geom.Rectangle(worldPoint.x, worldPoint.y, 1, 1)
                    )
                );

                if (clickedEnemy) {
                    this.player.setTargetEnemy(clickedEnemy);
                    this.movePlayerToEnemy(clickedEnemy);
                } else {
                    this.player.setTargetEnemy(null);
                    const tileX = Math.floor(worldPoint.x / this.player.tileSize);
                    const tileY = Math.floor(worldPoint.y / this.player.tileSize);
                    this.movePlayerToTile(tileX, tileY);
                }
            } else if (pointer.rightButtonDown()) {
                this.isRightButtonDown = true;
            }

            this.dragStartPosition = { x: pointer.x, y: pointer.y };
            this.isDragging = false;
        });

        // Update the right-click handler
        this.input.on('pointerup', (pointer) => {
            if (this.isLeftButtonDown) {
                this.isLeftButtonDown = false;
                if (!this.isDragging) {
                    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                    const tileX = Math.floor(worldPoint.x / this.player.tileSize);
                    const tileY = Math.floor(worldPoint.y / this.player.tileSize);
                    
                    // Find path using A*
                    const path = this.astar.findPath(
                        this.player.sprite.x,
                        this.player.sprite.y,
                        tileX * this.player.tileSize + this.player.tileSize / 2,
                        tileY * this.player.tileSize + this.player.tileSize / 2
                    );

                    this.player.moveTo(tileX, tileY, path);
                    
                    // Show and position the target indicator
                    this.targetIndicator.setPosition(
                        (tileX * this.player.tileSize) + (this.player.tileSize / 2),
                        (tileY * this.player.tileSize) + (this.player.tileSize / 2)
                    );
                    this.targetIndicator.setVisible(true);
                }
            } else if (this.isRightButtonDown) {
                this.isRightButtonDown = false;
                if (!this.isDragging) {
                    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                    const clickedEnemy = this.enemies.find(enemy => 
                        Phaser.Geom.Intersects.RectangleToRectangle(
                            new Phaser.Geom.Rectangle(enemy.sprite.x - enemy.sprite.width/2, enemy.sprite.y - enemy.sprite.height/2, enemy.sprite.width, enemy.sprite.height),
                            new Phaser.Geom.Rectangle(worldPoint.x, worldPoint.y, 1, 1)
                        )
                    );

                    const menuX = pointer.x;
                    const menuY = pointer.y;
                    
                    // Check if the menu would go off-screen and adjust if necessary
                    const menuWidth = 120;
                    const menuHeight = 160;
                    const gameWidth = this.sys.game.config.width;
                    const gameHeight = this.sys.game.config.height;

                    const adjustedX = menuX + menuWidth > gameWidth ? gameWidth - menuWidth : menuX;
                    const adjustedY = menuY + menuHeight > gameHeight ? gameHeight - menuHeight : menuY;

                    this.scene.launch('rightClickMenu', { 
                        x: adjustedX, 
                        y: adjustedY, 
                        parentScene: this,
                        clickedEnemy: clickedEnemy
                    });
                }
            }

            this.dragStartPosition = null;
            this.isDragging = false;
        });

        this.input.on('pointermove', (pointer) => {
            if (this.dragStartPosition) {
                const distance = Phaser.Math.Distance.Between(
                    this.dragStartPosition.x,
                    this.dragStartPosition.y,
                    pointer.x,
                    pointer.y
                );

                if (distance > this.dragThreshold) {
                    this.isDragging = true;
                    if (this.isLeftButtonDown) {
                        const dragX = this.dragStartPosition.x - pointer.x;
                        const dragY = this.dragStartPosition.y - pointer.y;
                        this.cameras.main.scrollX += dragX;
                        this.cameras.main.scrollY += dragY;
                        this.dragStartPosition = { x: pointer.x, y: pointer.y };
                    }
                }
            }

            this.updateTileOutline(pointer);
        });

        this.input.on('pointerupoutside', (pointer) => {
            this.isLeftButtonDown = false;
            this.isRightButtonDown = false;
            this.dragStartPosition = null;
            this.isDragging = false;
        });

        // Add more key listeners here as needed
    }
    toggleScreenMeasure() {
        if (this.scene.isPaused('game')) {
            this.scene.resume('game');
            this.scene.stop('screenMeasure');
        } else {
            this.scene.pause('game');
            this.scene.launch('screenMeasure');
        }
    }
    disableContextMenu() {
        const gameContainer = this.game.canvas;
        gameContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    toggleTimeScale() {
        const currentScale = this.worldTimeManager.timeScale;
        if (currentScale === 1) {
            this.worldTimeManager.setTimeScale(60); // 1 second real time = 1 hour game time
        } else {
            this.worldTimeManager.setTimeScale(1); // Reset to normal speed
        }
    }
    toggleGlobalIllumination() {
        this.globalIlluminationEnabled = !this.globalIlluminationEnabled;
        this.lightingSystem.toggleGlobalIllumination();
        console.log(`Global Illumination: ${this.globalIlluminationEnabled ? 'Enabled' : 'Disabled'}`);
    }
    toggleJournal() {
        if (this.scene.isPaused('game')) {
            this.scene.resume('game');
            this.scene.stop('journal');
        } else {
            this.scene.pause('game');
            this.scene.launch('journal', { player: this.player });
        }
    }
    // Tile highlight and oulines.
    updateTileOutline(pointer) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const tileX = Math.floor(worldPoint.x / this.player.tileSize);
        const tileY = Math.floor(worldPoint.y / this.player.tileSize);

        this.drawCellHighlight(tileX, tileY);
    }
    drawCellHighlight(tileX, tileY) {
        this.tileOutline.clear();
        this.tileOutline.lineStyle(this.cellHighlightThickness, 0xffff00, 1);
        this.tileOutline.strokeRect(
            tileX * this.player.tileSize,
            tileY * this.player.tileSize,
            this.player.tileSize,
            this.player.tileSize
        );
    }
    // Journal.
    createJournal() {
        this.scene.add('journal', Journal, false);
    }
    updateEnemies(time, delta){
        for (let enemy of this.enemies) {
            enemy.update(time, delta);
        }
    }
    // Test functions.
    testDamage() {
        // Simulate the player taking 15 damage
        this.player.combatComponent.receiveDamage(15);
    }
}

const container = document.getElementById('renderDiv');
const config = {
    type: Phaser.WebGL,
    parent: 'renderDiv',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    pixelArt: true,
    antialias: false,
    width: 960,
    height: 540,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, 
            debug: false
        }
    },
    scene: [Game, ScreenMeasureScene, RightClickMenuScene]
};

window.phaserGame = new Phaser.Game(config);