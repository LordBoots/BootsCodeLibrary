// ThreeJS revision: 152
import * as HOWLER from 'https://cdn.jsdelivr.net/npm/howler@2.2.3/dist/howler.min.js';
// Global Variables:
window.monsterSpawned = false;
// IMPORTS:
import * as THREE from 'three';
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
import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import {
    BGE
} from 'https://play.rosebud.ai/assets/Imports.js?E1qp';
// Sound Assets Dictionary
window.SOUND_ASSETS = {
    music: {
        mainTheme: {
            url: 'https://play.rosebud.ai/assets/rosebud_official_theme_02.mp3?GYVB',
            volume: 0.1,
            loop: true
        },
        menuTheme: {
            url: 'https://play.rosebud.ai/assets/Phantasmas en la Niebla.mp3?6FDN',
            volume: 0.05,
            loop: true
        },
        ambient: {
            url: 'https://play.rosebud.ai/assets/Nightmare Serenade.mp3?Eh1m',
            volume: 0.2,
            loop: true
        }
    },
    sfx: {
        footstep: {
            url: 'https://play.rosebud.ai/assets/Concrete 1.wav?unDD',
            volume: 0.02,
            loop: false,
            category: 'sfx',
            pitch: 1.0
        },
        whispering: {
            url: 'https://play.rosebud.ai/assets/CreepyWhispering.mp3?oaJD',
            volume: 0.5,
            loop: false,
            category: 'sfx',
            pitch: 1.0
        },
        hiss: {
            url: 'https://play.rosebud.ai/assets/Hiss.mp3?Ss63',
            volume: 1.0,
            loop: false,
            category: 'sfx',
            pitch: 1.0
        },
        scaryDrone: {
            url: 'https://play.rosebud.ai/assets/ScaryDrone.mp3?dTEZ',
            volume: 0.5,
            loop: true,
            category: 'sfx',
            pitch: 1.0
        }
    },
    ambiance: {
        caveWind1: {
            url: 'https://play.rosebud.ai/assets/Cavewind1.mp3?9sLb',
            volume: 0.05,
            loop: true,
            category: 'sfx',
            pitch: 1.0
        }

    }

};
import {
    THREEDEV
} from 'https://play.rosebud.ai/assets/UI.js?G64T';
//=========================================
// Initialize Main Game loader components:
window.Logger = new BGE.LogManager();
Logger.init();
window.GAME_READY = false;
//=========================================

window.APP_SETTINGS = {
    input: {
        mouse: {
            sensitivity: 0.002
        },
        controller: {
            horizontalSensitivity: 50,
            verticalSensitivity: 50
        }
    },
    renderer: {
        shadowMap: {
            enabled: true,
            type: THREE.PCFSoftShadowMap,
            autoUpdate: true,
            needsUpdate: true
        },
        colorSpace: {
            output: THREE.SRGBColorSpace,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0
        },
        antialias: true,
        pixelRatio: window.devicePixelRatio
    },
    world: {
        defaults: {
            skyColor: 0x87CEEB,
            groundColor: 0xdefeff
        },
        fog: {
            enabled: true,
            color: 0x303030,
            near: 1,
            far: 100
        }
    },
    camera: {
        fov: 98,
        near: 0.1,
        far: 10000,
        initialPosition: {
            x: 0,
            y: 50,
            z: 0
        }
    },
    lights: {
        ambient: {
            color: 0x404040, // Soft gray color
            intensity: 1.0, // Constant ambient light intensity
            position: {
                x: 0,
                y: 100,
                z: 0
            },
        }
    }
};

window.RENDER_CFG = {
    shadowMap: {
        enabled: true,
        type: THREE.PCFSoftShadowMap,
        autoUpdate: true,
        needsUpdate: true
    },
    colorSpace: {
        output: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0
    },
    antialias: true,
    pixelRatio: window.devicePixelRatio
};
window.CAMERA_CFG = {
    main: {
        fov: 94,
        near: 0.1,
        far: 10000,
        initialPosition: {
            x: 0,
            y: 1,
            z: 0
        }
    }
};
window.WORLD_CFG = {
    defaults: {
        skyColor: 0x87CEEB,
        groundColor: 0xdefeff
    },
    fog: {
        enabled: true,
        color: 0x303030,
        near: 1,
        far: 100
    }    
};
window.LIGHT_CFG = {
    ambient: {
        color: 0x404040, // Soft gray color
        intensity: 1.0, // Constant ambient light intensity
        position: {
            x: 0,
            y: 100,
            z: 0
        },
    }    
};


window.NOTE_CONTENT = {
    "mysterious_note": {
        title: "Diary Entry: Miner's Delusions",
        content: DIARY.note1,
        found: false,
        image: "https://play.rosebud.ai/assets/Diary1.png?fVfW"
    },
    "storeRoom": {
        title: "Diary Entry: Nothing out of place",
        content: DIARY.note2,
        found: false,
        image: "https://play.rosebud.ai/assets/Diary1.png?fVfW"
    },
    "storeRoomTunnel": {
        title: "Diary: Old Mine entrance",
        content: DIARY.note3,
        found: false,
        image: "https://play.rosebud.ai/assets/Diary1.png?fVfW"
    },
    "scaffold": {
        title: "Diary: Watching the Depths",
        content: DIARY.note4,
        found: false,
        image: "https://play.rosebud.ai/assets/Diary1.png?fVfW"
    },
    "cartBridge": {
        title: "Diary: Suspended Fear",
        content: DIARY.note5,
        found: false,
        image: "https://play.rosebud.ai/assets/Diary1.png?fVfW"
    },
    "acrossBridge": {
        title: "Diary: Louder Than The Mind",
        content: DIARY.note6,
        found: false,
        image: "https://play.rosebud.ai/assets/Diary1.png?fVfW"
    },
    "lastTunnel": {
        title: "Uncovered Secrets",
        content: DIARY.note7,
        found: false,
        image: "https://play.rosebud.ai/assets/Diary1.png?fVfW"
    },
    "final": {
        title: "Diary: The Endless Corridor",
        content: DIARY.note8,
        found: false,
        image: "https://play.rosebud.ai/assets/Diary1.png?fVfW"
    }
};
// DATA: 
window.MATERIAL_DATA = {};
window.TEXTURE_ASSETS = {
    normal: {},
    texture: {},
    maps: {
        'TestNormalMap': 'https://play.rosebud.ai/assets/NormalMapTest1.png?Rlxf',
        'BrickHeight': 'https://play.rosebud.ai/assets/BrickHeight.png?GltH'
    },
    sprites: {
        'TomeSprites': 'https://play.rosebud.ai/assets/Tomes32x32.png?meX8',
    }
};
window.LOADING_TIPS = [
    "Collect notes as you go!",
    "You can customize your controls in the settings",
    "Take breaks between long gaming sessions",
];
window.KEYMAP = {
    forward: {
        keyboard: ['KeyW'],
        controller: {
            buttons: [],
            axes: []
        }
    },
    backward: {
        keyboard: ['KeyS'],
        controller: {
            buttons: [],
            axes: []
        }
    },
    left: {
        keyboard: ['KeyA'],
        controller: {
            buttons: [],
            axes: []
        }
    },
    right: {
        keyboard: ['KeyD'],
        controller: {
            buttons: [],
            axes: []
        }
    },
    interact: {
        keyboard: ['KeyF'],
        controller: {
            buttons: ['DpadRight'],
            axes: []
        }
    },
    sprint: {
        keyboard: ['ShiftLeft'],
        controller: {
            buttons: ['L3'],
            axes: []
        }
    }
};
window.initializationProgress = {
    current: 0,
    target: 10
};

class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.songs = new Map();
        this.ambiance = new Map();
        this.enabled = true;
        this.currentSong = null;
        this.currentAmbiance = null;
        // Volume settings are now entirely managed by SOUND_ASSETS
        this.dependencyChecker = new BGE.DependencyChecker(this, 'Sound');
    }
    init() {
        this.loadSounds();
    }
    loadSounds() {
        // Load music
        Object.entries(SOUND_ASSETS.music).forEach(([name, asset]) => {
            this.loadSong(name, asset);
        });
        // Load ambiance
        Object.entries(SOUND_ASSETS.ambiance).forEach(([name, asset]) => {
            this.loadAmbiance(name, asset);
        });
        // Load sound effects
        Object.entries(SOUND_ASSETS.sfx).forEach(([name, asset]) => {
            this.loadSoundEffect(name, asset);
        });
        this.dependencyChecker.readyToRegister = true;
    }
    loadAmbiance(name, asset) {
        try {
            Logger.queueLog('Sound', `Loading ambiance: ${name}`, 'Initialize');
            const audio = new Audio();
            audio.src = asset.url;
            audio.volume = 0; // Start with volume 0
            audio.loop = asset.loop !== undefined ? asset.loop : true; // Ambiance loops by default

            // Wait for 'canplaythrough' event before setting volume
            audio.addEventListener('canplaythrough', () => {
                audio.volume = Math.max(0, Math.min(1, asset.volume || 1)); // Set intended volume
                Logger.queueLog('Sound', `Ambiance ${name} is ready to play`, 'Initialize');
            }, {
                once: true
            });
            const ambianceObject = {
                audio: audio,
                baseVolume: asset.volume,
                isPlaying: false,
                fadeInterval: null
            };
            this.ambiance.set(name, ambianceObject);
            Logger.queueLog('Sound', `Loaded ambiance: ${name}`, 'Initialize');
        } catch (error) {
            Logger.queueLog('Sound', `Error loading ambiance ${name}: ${error}`, 'Error');
        }
    }
    playAmbiance(name) {
        if (!this.enabled) {
            Logger.queueLog('Sound', `Sound system is disabled, cannot play ambiance: ${name}`, 'Info');
            return;
        }
        const ambiance = this.ambiance.get(name);
        if (!ambiance) {
            Logger.queueLog('Sound', `Ambiance not found: ${name}`, 'Error');
            return;
        }
        try {
            Logger.queueLog('Sound', `Attempting to play ambiance: ${name}`, 'Info');

            // Store the name with the ambiance object
            ambiance.name = name;

            // Stop current ambiance if there is one
            if (this.currentAmbiance) {
                Logger.queueLog('Sound', `Stopping current ambiance before playing: ${name}`, 'Info');
                this.stopAmbiance();
            }

            // Set currentAmbiance before playing
            this.currentAmbiance = ambiance;

            ambiance.audio.currentTime = 0;
            Logger.queueLog('Sound', `Starting playback of ambiance: ${name}`, 'Info');

            ambiance.audio.play()
                .then(() => {
                    ambiance.isPlaying = true;
                    Logger.queueLog('Sound', `Successfully started playing ambiance: ${name}`, 'Info');
                })
                .catch(e => {
                    Logger.queueLog('Sound', `Error playing ambiance: ${e}`, 'Error');
                    this.currentAmbiance = null;
                    ambiance.isPlaying = false;
                });
        } catch (error) {
            Logger.queueLog('Sound', `Error playing ambiance ${name}: ${error}`, 'Error');
        }
    }
    stopAmbiance() {
        Logger.queueLog('Sound', 'Attempting to stop ambiance', 'Info');

        if (!this.currentAmbiance) {
            Logger.queueLog('Sound', `No current ambiance to stop`, 'Info');
            return;
        }

        const ambianceName = this.currentAmbiance.name || 'unknown';

        try {
            Logger.queueLog('Sound', `Stopping ambiance: ${ambianceName}`, 'Info');

            this.currentAmbiance.audio.pause();
            this.currentAmbiance.audio.currentTime = 0;
            this.currentAmbiance.isPlaying = false;
            this.currentAmbiance = null;

            Logger.queueLog('Sound', `Successfully stopped ambiance: ${ambianceName}`, 'Info');
        } catch (error) {
            Logger.queueLog('Sound', `Error stopping ambiance ${ambianceName}: ${error}`, 'Error');
            this.currentAmbiance = null;
        }
    }

    loadSong(name, asset) {
        try {
            Logger.queueLog('Sound', `Loading song: ${name}`, 'Initialize');
            const audio = new Audio();
            audio.src = asset.url;
            audio.volume = 0; // Start with volume 0
            audio.loop = asset.loop !== undefined ? asset.loop : true; // Songs loop by default
            // Wait for 'canplaythrough' event before setting volume
            audio.addEventListener('canplaythrough', () => {
                audio.volume = Math.max(0, Math.min(1, asset.volume || 1)); // Set intended volume
                Logger.queueLog('Sound', `Song ${name} is ready to play`, 'Initialize');
            }, {
                once: true
            });
            const songObject = {
                audio: audio,
                baseVolume: asset.volume,
                isPlaying: false,
                fadeInterval: null
            };
            this.songs.set(name, songObject);
            Logger.queueLog('Sound', `Loaded song: ${name}`, 'Initialize');
        } catch (error) {
            Logger.queueLog('Sound', `Error loading song ${name}: ${error}`, 'Error');
        }
    }

    loadSoundEffect(name, asset) {
        try {
            Logger.queueLog('Sound', `Loading sound effect: ${name}`, 'Initialize');
            const audio = new Audio();
            audio.src = asset.url;
            audio.volume = 0; // Start with volume 0
            audio.loop = asset.loop;
            // Wait for 'canplaythrough' event before setting volume
            audio.addEventListener('canplaythrough', () => {
                audio.volume = Math.max(0, Math.min(1, asset.volume || 1)); // Set intended volume
                Logger.queueLog('Sound', `Sound effect ${name} is ready to play`, 'Initialize');
            }, {
                once: true
            });
            // Store additional properties
            const soundObject = {
                audio: audio,
                baseVolume: asset.volume,
                isPlaying: false,
                fadeInterval: null,
                category: asset.category || 'sfx', // Default to sfx if not specified
                basePitch: asset.pitch || 1.0, // Default pitch value
                currentPitch: asset.pitch || 1.0 // Current pitch value
            };
            this.sounds.set(name, soundObject);
            Logger.queueLog('Sound', `Loaded sound: ${name}`, 'Initialize');
        } catch (error) {
            Logger.queueLog('Sound', `Error loading sound ${name}: ${error}`, 'Error');
        }
    }
    // Volume control:
    // Volume control is now managed by SOUND_ASSETS
    // Song Control:
    playSong(name) {
        if (!this.enabled) {
            Logger.queueLog('Sound', `Sound system is disabled, cannot play: ${name}`, 'Info');
            return;
        }
        const song = this.songs.get(name);
        if (!song) {
            Logger.queueLog('Sound', `Song not found: ${name}`, 'Error');
            return;
        }
        try {
            Logger.queueLog('Sound', `Attempting to play song: ${name}`, 'Info');

            // Store the name with the song object for better tracking
            song.name = name;

            // Stop current song if there is one
            if (this.currentSong) {
                Logger.queueLog('Sound', `Stopping current song before playing: ${name}`, 'Info');
                this.stopSong();
            }

            // Set currentSong before playing
            this.currentSong = song;

            song.audio.currentTime = 0;
            Logger.queueLog('Sound', `Starting playback of: ${name}`, 'Info');

            // Play the audio and handle the promise
            song.audio.play()
                .then(() => {
                    song.isPlaying = true;
                    Logger.queueLog('Sound', `Successfully started playing: ${name}`, 'Info');
                })
                .catch(e => {
                    Logger.queueLog('Sound', `Error playing song: ${e}`, 'Error');
                    this.currentSong = null;
                    song.isPlaying = false;
                });
        } catch (error) {
            Logger.queueLog('Sound', `Error playing song ${name}: ${error}`, 'Error');
        }
    }
    stopSong() {
        Logger.queueLog('Sound', 'Attempting to stop song', 'Info');

        // Early return with more detailed logging
        if (!this.currentSong) {
            Logger.queueLog('Sound', `No current song to stop (currentSong is ${this.currentSong})`, 'Info');
            return;
        }

        // Get song name directly from stored name or find it in the map
        const songName = this.currentSong.name || [...this.songs.entries()].find(([_, song]) => song === this.currentSong)?.[0] || 'unknown';

        Logger.queueLog('Sound', `Found song to stop: ${songName}`, 'Info');

        if (!this.currentSong.audio) {
            Logger.queueLog('Sound', `Current song has no audio element: ${songName}`, 'Error');
            this.currentSong = null;
            return;
        }

        try {
            Logger.queueLog('Sound', `Stopping song: ${songName}`, 'Info');

            // First stop the playback
            this.currentSong.audio.pause();
            Logger.queueLog('Sound', `Paused audio for: ${songName}`, 'Info');

            // Reset the audio to beginning
            this.currentSong.audio.currentTime = 0;

            // Update song state
            this.currentSong.isPlaying = false;

            // Clear the current song reference
            this.currentSong = null;

            Logger.queueLog('Sound', `Successfully stopped song: ${songName}`, 'Info');
        } catch (error) {
            Logger.queueLog('Sound', `Error stopping song ${songName}: ${error}`, 'Error');
            // Still clear the current song even if there's an error
            this.currentSong = null;
        }
    }
    pauseSong() {
        if (this.currentSong && this.currentSong.isPlaying) {
            this.currentSong.audio.pause();
            Logger.queueLog('Sound', `Paused current song`, 'Info');
        }
    }
    unpauseSong() {
        if (this.currentSong && this.currentSong.audio) {
            this.currentSong.audio.play().catch(e => Logger.queueLog('Sound', `Error resuming song: ${e}`, 'Error'));
            Logger.queueLog('Sound', `Resumed current song`, 'Info');
        }
    }
    // SFX control:
    playSound(name, pitch = 1.0) {
        if (!this.enabled) return;
        const sound = this.sounds.get(name);
        if (!sound) {
            Logger.queueLog('Sound', `Sound effect not found: ${name}`, 'Error');
            return;
        }
        try {
            // Sound effects are always one-shot
            const oneshotAudio = new Audio(sound.audio.src);
            oneshotAudio.volume = Math.max(0, Math.min(1, sound.baseVolume || 1)); // Clamp volume to valid range
            // Adjust playback rate for pitch
            oneshotAudio.playbackRate = pitch;
            oneshotAudio.play().catch(e => Logger.queueLog('Sound', `Error playing sound effect: ${e}`, 'Error'));
            Logger.queueLog('Sound', `Playing sound effect: ${name} with pitch ${pitch}`, 'Info');
        } catch (error) {
            Logger.queueLog('Sound', `Error playing sound effect ${name}: ${error}`, 'Error');
        }
    }
    setPitch(name, pitch) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.currentPitch = Math.max(0.1, Math.min(4.0, pitch)); // Clamp between 0.1 and 4.0
            Logger.queueLog('Sound', `Set pitch for ${name} to ${pitch}`, 'Info');
        } else {
            Logger.queueLog('Sound', `Sound effect not found: ${name}`, 'Error');
        }
    }
    resetPitch(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.currentPitch = sound.basePitch;
            Logger.queueLog('Sound', `Reset pitch for ${name} to base pitch ${sound.basePitch}`, 'Info');
        } else {
            Logger.queueLog('Sound', `Sound effect not found: ${name}`, 'Error');
        }
    }
    pauseSound(name) {
        const sound = this.sounds.get(name);
        if (sound && sound.isPlaying) {
            sound.audio.pause();
            sound.isPlaying = false;
            Logger.queueLog('Sound', `Paused sound: ${name}`, 'Info');
        }
    }
    resumeSound(name) {
        const sound = this.sounds.get(name);
        if (sound && !sound.isPlaying) {
            sound.audio.play().catch(e => Logger.queueLog('Sound', `Error resuming sound: ${e}`, 'Error'));
            sound.isPlaying = true;
            Logger.queueLog('Sound', `Resumed sound: ${name}`, 'Info');
        }
    }
    fadeSongOut(duration = 1000) {
        if (!this.currentSong) return;
        // Get the actual song object instead of trying to get it from the map again
        const song = this.currentSong;
        if (!song || !song.isPlaying) return;
        // Clear any existing fade interval
        if (song.fadeInterval) {
            clearInterval(song.fadeInterval);
        }
        const startVolume = song.audio.volume;
        const steps = 60; // Increase steps for smoother fade
        const volumeStep = startVolume / steps;
        const intervalTime = duration / steps;
        song.fadeInterval = setInterval(() => {
            if (song.audio.volume > volumeStep) {
                song.audio.volume = Math.max(0, song.audio.volume - volumeStep);
            } else {
                // Clear the interval first
                clearInterval(song.fadeInterval);
                song.fadeInterval = null;

                // Then stop the song
                song.audio.pause();
                song.audio.volume = song.baseVolume; // Use baseVolume directly
                song.isPlaying = false;
                this.currentSong = null;
            }
        }, intervalTime);
    }
    fadeSongIn(name, duration = 1000) {
        const song = this.songs.get(name);
        if (!song) return;
        // Stop current song if there is one
        if (this.currentSong) {
            this.fadeSongOut(duration);
        }
        if (song.fadeInterval) {
            clearInterval(song.fadeInterval);
        }
        const targetVolume = song.baseVolume; // Use baseVolume directly from the song
        song.audio.volume = 0;
        song.audio.play().catch(e => Logger.queueLog('Sound', `Error starting fade-in: ${e}`, 'Error'));
        song.isPlaying = true;
        this.currentSong = song; // Store the song object instead of just the name
        const steps = 20;
        const volumeStep = targetVolume / steps;
        const intervalTime = duration / steps;
        song.fadeInterval = setInterval(() => {
            if (song.audio.volume < targetVolume - volumeStep) {
                song.audio.volume += volumeStep;
            } else {
                song.audio.volume = targetVolume;
                clearInterval(song.fadeInterval);
                song.fadeInterval = null;
            }
        }, intervalTime);
    }
    toggleMute() {
        this.enabled = !this.enabled;
        // Update songs
        this.songs.forEach(song => {
            if (this.enabled) {
                song.audio.volume = song.baseVolume; // Use baseVolume directly
            } else {
                song.audio.volume = 0;
            }
        });
        // Update ambiance
        this.ambiance.forEach(ambiance => {
            if (this.enabled) {
                ambiance.audio.volume = ambiance.baseVolume; // Use baseVolume directly
            } else {
                ambiance.audio.volume = 0;
            }
        });
        // Update sound effects volume for next playback
        this.sounds.forEach(sound => {
            sound.audio.volume = this.enabled ? sound.baseVolume : 0; // Use baseVolume directly
        });

        Logger.queueLog('Sound', `Sound ${this.enabled ? 'enabled' : 'muted'}`, 'Settings');
    }


}
class HowlerSoundManager {
    constructor() {
        this.sounds = new Map();
        this.categories = new Map();
        this.spatialListeners = new Map();
        this.masterVolume = 1.0;
        this.positionalAudioEnabled = true;
        this.listenerPosition = new THREE.Vector3();
        this.initialized = false;
    }

    init() {
        // Set up Howler's spatial audio listener
        Howler.orientation(0, 0, -1, 0, 1, 0);
        this.initialized = true;
        Logger.queueLog('SoundFX', 'Howler Sound Manager initialized', 'Initialize');
    }

    loadSound(name, url, category = 'default', options = {}) {
        return new Promise((resolve, reject) => {
            if (this.sounds.has(name)) {
                resolve(this.sounds.get(name));
                return;
            }

            const sound = new Howl({
                src: [url],
                volume: options.volume || 1.0,
                loop: options.loop || false,
                autoplay: false,
                onload: () => {
                    this.sounds.set(name, sound);
                    this.addToCategory(name, category);
                    Logger.queueLog('SoundFX', `Loaded sound: ${name}`, 'Initialize');
                    resolve(sound);
                },
                onloaderror: (id, error) => {
                    Logger.queueLog('SoundFX', `Error loading sound ${name}: ${error}`, 'Error');
                    reject(error);
                }
            });
        });
    }

    play(name, position = null, options = {}) {
        if (!this.initialized) {
            Logger.queueLog('SoundFX', 'Sound manager not initialized', 'Error');
            return null;
        }

        const sound = this.sounds.get(name);
        if (!sound) {
            Logger.queueLog('SoundFX', `Sound not found: ${name}`, 'Error');
            return null;
        }

        const soundId = sound.play();

        if (this.positionalAudioEnabled && position) {
            this.setPosition(soundId, position);
        }

        // Apply options
        if (options.volume !== undefined) {
            sound.volume(options.volume * this.masterVolume, soundId);
        }
        if (options.loop !== undefined) {
            sound.loop(options.loop, soundId);
        }
        if (options.rate !== undefined) {
            sound.rate(options.rate, soundId);
        }

        Logger.queueLog('SoundFX', `Playing sound: ${name}`, 'Debug');
        return soundId;
    }

    setPosition(soundId, position) {
        const sound = this.getSoundById(soundId);
        if (!sound) return;

        const relativePosition = position.clone().sub(this.listenerPosition);
        const x = relativePosition.x;
        const y = relativePosition.y;
        const z = relativePosition.z;

        sound.pannerAttr({
            panningModel: 'HRTF',
            distanceModel: 'inverse',
            refDistance: 1.0,
            maxDistance: 100.0,
            rolloffFactor: 1.0,
            coneInnerAngle: 360,
            coneOuterAngle: 0,
            coneOuterGain: 0
        }, soundId);

        sound.pos(x, y, z, soundId);
    }

    updateListenerPosition(position, forward, up) {
        this.listenerPosition.copy(position);
        Howler.pos(position.x, position.y, position.z);
        Howler.orientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }

    addToCategory(name, category) {
        if (!this.categories.has(category)) {
            this.categories.set(category, new Set());
        }
        this.categories.get(category).add(name);
    }

    setCategoryVolume(category, volume) {
        if (!this.categories.has(category)) return;

        this.categories.get(category).forEach(name => {
            const sound = this.sounds.get(name);
            if (sound) {
                sound.volume(volume * this.masterVolume);
            }
        });
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        Howler.volume(this.masterVolume);
        Logger.queueLog('SoundFX', `Master volume set to: ${this.masterVolume}`, 'Settings');
    }

    stop(soundId) {
        const sound = this.getSoundById(soundId);
        if (sound) {
            sound.stop(soundId);
        }
    }

    getSoundById(soundId) {
        for (const [name, sound] of this.sounds.entries()) {
            if (sound && sound._ids && sound._ids.includes(soundId)) {
                return sound;
            }
        }
        return null;
    }

    setVolume(name, volume) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.volume(volume * this.masterVolume);
            Logger.queueLog('SoundFX', `Set volume for ${name} to ${volume}`, 'Debug');
        } else {
            Logger.queueLog('SoundFX', `Sound not found: ${name}`, 'Error');
        }
    }
    stopAll() {
        this.sounds.forEach(sound => sound.stop());
        Logger.queueLog('SoundFX', 'Stopped all sound effects', 'Debug');
    }
    dispose() {
        this.sounds.forEach(sound => sound.unload());
        this.sounds.clear();
        this.categories.clear();
        Howler.unload();
    }
}
class FarGhosts {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.ghosts = [];
        this.spawnInterval = 200; // Spawn a ghost every 1 second for testing
        this.maxDistance = 70; // Maximum distance from the camera
        this.minDistance = 28; // Minimum distance from the camera
        this.ghostLifetime = 2000; // Ghosts last for 5 seconds
        this.maxOpacity = 0.2; // Maximum opacity for ghosts (default: 0.4)
        this.ghostMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        this.ghostGeometry = new THREE.SphereGeometry(1, 8, 8); // Simple sphere for testing
        this.spawnTimer = 0; // Timer to track spawn intervals
        this.dependencyChecker = new BGE.DependencyChecker(this, 'FarGhosts', ['World']);
        this.hasFaded = false; // Track if ghosts have faded in and out
    }
    init() {
        this.scene = WorldScene;
        this.camera = MainCamera;
        this.dependencyChecker.readyToRegister = true;

    }
    spawnGhost() {
        // Calculate a random direction and distance
        const angle = Math.random() * Math.PI * 2;
        const distance = this.minDistance + Math.random() * (this.maxDistance - this.minDistance);
        const offset = new THREE.Vector3(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        );
        // Calculate the spawn position relative to the camera
        const spawnPosition = this.camera.position.clone().add(offset);
        // Raycast to find the floor position
        const raycaster = new THREE.Raycaster(
            spawnPosition.clone().add(new THREE.Vector3(0, 100, 0)), // Start above the spawn position
            new THREE.Vector3(0, -1, 0) // Ray points downward
        );
        const intersects = raycaster.intersectObjects(GameWorld.floorMeshes);
        if (intersects.length > 0) {
            const floorPosition = intersects[0].point;
            // Create the ghost mesh
            const ghostMesh = new THREE.Mesh(this.ghostGeometry, this.ghostMaterial);
            ghostMesh.position.copy(floorPosition);
            ghostMesh.position.y += 1; // Slightly above the floor
            this.scene.add(ghostMesh);
            // Add to the ghosts array
            this.ghosts.push({
                mesh: ghostMesh,
                spawnTime: performance.now()
            });
        }
    }
    update(deltaTime) {
        // Only spawn and update ghosts if they haven't faded yet
        if (!this.hasFaded) {
            // Update spawn timer
            this.spawnTimer += deltaTime * 1000; // Convert deltaTime to milliseconds
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnGhost();
                this.spawnTimer = 0; // Reset the timer
            }
            // Update existing ghosts
            const currentTime = performance.now();
            for (let i = this.ghosts.length - 1; i >= 0; i--) {
                const ghost = this.ghosts[i];
                const elapsedTime = currentTime - ghost.spawnTime;
                if (elapsedTime >= this.ghostLifetime) {
                    // Remove the ghost if its lifetime is over
                    this.scene.remove(ghost.mesh);
                    this.ghosts.splice(i, 1);
                    // Mark that ghosts have faded
                    if (this.ghosts.length === 0) {
                        this.hasFaded = true;
                    }
                } else {
                    // Calculate opacity based on a sine wave for smooth fade-in and fade-out
                    const progress = elapsedTime / this.ghostLifetime;
                    const opacity = Math.sin(progress * Math.PI) * this.maxOpacity; // Use maxOpacity property
                    ghost.mesh.material.opacity = opacity;
                }
            }
        }
    }
}
class InteractionPrompt extends HTMLElement {
    constructor() {
        super();
        this.style.position = 'absolute';
        this.style.left = '50%';
        this.style.top = '60%';
        this.style.transform = 'translate(-50%, -50%)';
        this.style.display = 'none';
        this.style.zIndex = '170';
        this.style.color = '#ffffff';
        this.style.fontFamily = 'Arial, sans-serif';
        this.style.fontSize = '24px';
        this.style.textAlign = 'center';
        this.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        this.style.zIndex = '100';
        this.style.pointerEvents = 'none';

        // Create key indicator
        this.keyElement = document.createElement('div');
        this.keyElement.textContent = 'F';
        this.keyElement.style.border = '2px solid #ffffff';
        this.keyElement.style.borderRadius = '5px';
        this.keyElement.style.padding = '5px 12px';
        this.keyElement.style.marginBottom = '5px';
        this.keyElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

        // Create text element
        this.textElement = document.createElement('div');
        this.textElement.textContent = 'to interact';
        this.textElement.style.fontSize = '16px';

        this.appendChild(this.keyElement);
        this.appendChild(this.textElement);
    }

    show() {
        this.style.display = 'block';
        // Add fade-in animation
        this.style.opacity = '0';
        this.style.transition = 'opacity 0.2s ease-in';
        requestAnimationFrame(() => {
            this.style.opacity = '1';
        });
    }

    hide() {
        this.style.opacity = '0';
        setTimeout(() => {
            this.style.display = 'none';
        }, 200);
    }

    setPosition(y) {
        this.style.top = `${y}%`;
    }

    setText(text) {
        this.textElement.textContent = text;
    }
}
customElements.define('interaction-prompt', InteractionPrompt);
	
	
// main rendering class
class Compositor {
    constructor() {
        this.renderer = null;
        this.composer = null;
        this.bloomPass = null;
        this.smaaPass = null;
        this.initRenderer();
        this.initCamera();
        this.initComposer();

    }
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: APP_SETTINGS.renderer.antialias,
            canvas: canvas,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(APP_SETTINGS.renderer.pixelRatio);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        // Shadow settings
        this.renderer.shadowMap.enabled = APP_SETTINGS.renderer.shadowMap.enabled;
        this.renderer.shadowMap.type = APP_SETTINGS.renderer.shadowMap.type;

        // Verify shadow settings
        Logger.queueLog('System', 'Verifying renderer shadow settings:', 'Initialize');
        Logger.queueLog('System', `- shadowMap.enabled: ${this.renderer.shadowMap.enabled}`, 'Initialize');
        Logger.queueLog('System', `- shadowMap.type: ${this.renderer.shadowMap.type}`, 'Initialize');
        Logger.queueLog('System', `- Expected type: ${APP_SETTINGS.renderer.shadowMap.type}`, 'Initialize');

        this.renderer.outputColorSpace = APP_SETTINGS.renderer.colorSpace.output;
        this.renderer.toneMapping = APP_SETTINGS.renderer.colorSpace.toneMapping;
        this.renderer.toneMappingExposure = APP_SETTINGS.renderer.colorSpace.toneMappingExposure;

        // Force shadow map update
        this.renderer.shadowMap.needsUpdate = true;

        Logger.queueLog('System', 'Renderer initialized with APP_SETTINGS parameters', 'Initialize');
    }
    initCamera() {
        window.MainCamera = new THREE.PerspectiveCamera(
            APP_SETTINGS.camera.fov,
            canvas.offsetWidth / canvas.offsetHeight,
            APP_SETTINGS.camera.near,
            APP_SETTINGS.camera.far
        );
        MainCamera.position.set(
            APP_SETTINGS.camera.initialPosition.x,
            APP_SETTINGS.camera.initialPosition.y,
            APP_SETTINGS.camera.initialPosition.z
        );
        MainCamera.lookAt(0, APP_SETTINGS.camera.initialPosition.y, -100);
        Logger.queueLog('World', 'Camera initialized with APP_SETTINGS parameters', 'Initialize');
    }
    initComposer() {
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(WorldScene, MainCamera);
        this.addPasses(renderPass);
    }
    addPasses(renderPass) {
        this.composer.addPass(renderPass);
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(innerWidth, innerHeight),
            0.2, // bloom strength
            0.4, // radius
            0.9 // threshold
        );
        this.composer.addPass(this.bloomPass);
        this.smaaPass = new SMAAPass(
            innerWidth * this.renderer.getPixelRatio(),
            innerHeight * this.renderer.getPixelRatio()
        );
        this.composer.addPass(this.smaaPass);
    }
    setSize(width, height) {
        this.composer.setSize(width, height);
        this.bloomPass.resolution.set(width, height);
        this.smaaPass.setSize(width, height);
    }
    render() {
        // Make sure shadow maps are updated
        this.renderer.shadowMap.needsUpdate = true;
        MainCamera.updateProjectionMatrix();


        if (this.composer) {
            // Check if post-processing is preserving shadows
            this.composer.render();
        } else {
            this.renderer.render(WorldScene, MainCamera);
        }
    }
}

class AreaTrigger {
    constructor(name, position, size, callback, resetTime = -1, requiresInteraction = false) {
        this.name = name;
        this.position = position.clone();
        this.size = size.clone();
        this.callback = callback;
        this.resetTime = resetTime;
        this.isActive = true;
        this.resetTimer = null;
        this.playerInside = false;
        this.requiresInteraction = requiresInteraction;
        this.interactKeyWasPressed = false;

        // Create trigger volume
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            visible: false // Hidden by default
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();
    }
    updateBoundingBox() {
        this.boundingBox.setFromObject(this.mesh);
    }
    trigger(context) {
        if (!this.isActive || !this.playerInside) return;
        // Simple interaction check
        if (this.requiresInteraction && !Input.keys.interact) return;
        // Hide interaction prompt when trigger is activated
        if (this.requiresInteraction) {
            Game.interactionPrompt.hide();
        }
        // Execute the trigger
        this.callback(context);
        this.isActive = false;
        Logger.queueLog('Trigger', `${this.name} activated`, 'Debug');
    }
    playerLeft() {
        this.playerInside = false;

        // Simple reset timer
        if (this.resetTime > 0 && !this.isActive) {
            if (this.resetTimer) clearTimeout(this.resetTimer);
            this.resetTimer = setTimeout(() => {
                this.isActive = true;
            }, this.resetTime * 1000);
        }
    }
    dispose() {
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
        }
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}
class World {
    constructor() {
        window.WorldScene = new THREE.Scene();
        this.triggers = []; // Array to store all area triggers
        this.isTriggersVisible = false; // Track trigger visualization state
        // Add fog to the scene
        this.fogSettings = {
            enabled: APP_SETTINGS.world.fog.enabled,
            color: APP_SETTINGS.world.fog.color,
            density: 0.09
        };
        if (this.fogSettings.enabled) {
            WorldScene.fog = new THREE.FogExp2(this.fogSettings.color, this.fogSettings.density);
        }
        this.lights = {};
        this.objects = new Map();
        this.floorMeshes = [];
        this.wallMeshes = [];
        this.dependencyChecker = new BGE.DependencyChecker(this, 'World', ['Materials', 'Textures']);
    }
    init() {
        window.GameRenderer = new Compositor();

        this.loadLevel();

    }
    addTriggers() {
        const monsterTrigger = new AreaTrigger(
            "MonsterTrigger",
            new THREE.Vector3(-115.36, -6.49, 75.04), // Position as specified
            new THREE.Vector3(5, 5, 5), // Size of trigger area
            (context) => {
                EnemyEntity.moveIndependently();
                // IMPORTANT! TRIGGER RUN MESSAGE
                Logger.queueLog('Trigger', 'Monster trigger activated!', 'Debug');
                // Show warning display
                // Play hiss sound at trigger position with adjusted parameters
                SoundFX.play('hiss', new THREE.Vector3(-53.50, -30, 36.60), {
                    volume: 0.7, // Increased volume
                    loop: false
                });
                // Play monster chase sound
                SoundFX.play('monsterChase', null, {
                    volume: 0.7,
                    loop: true
                });
                // Increase scary drone volume
                const scaryDroneSound = SoundFX.getSoundById('scaryDrone');
                if (scaryDroneSound) {
                    scaryDroneSound.volume(0.6);
                }

                // Create exit trigger at spawn point when monster is triggered
                const exitTrigger = new AreaTrigger(
                    "ExitTrigger",
                    new THREE.Vector3(0, 0, 0), // Spawn point position
                    new THREE.Vector3(5, 5, 5), // Size of exit area
                    (context) => {
                        SoundFX.stopAll(); // Stop all sound effects
                        EndScreen.showEscape();
                        Game.pauseGame(false, false);
                        Game.unlockPointer();
                        Logger.queueLog('Trigger', 'Player reached exit point!', 'Debug');
                        devConsole.log("Player reached the exit point!", "info");
                    },
                    -1, // Never reset
                    false // No interaction required
                );
                this.addTrigger(exitTrigger);
                // Create additional triggers for sound effects during chase
                const finalNoteSoundTrigger = new AreaTrigger(
                    "FinalNoteSoundTrigger",
                    new THREE.Vector3(-68.5, -0.27, 75.8), // Same as final note position
                    new THREE.Vector3(5, 5, 5), // 5x5x5 area
                    () => {
                        SoundFX.play('whispering', player.position, {
                            volume: 0.4, // Increased volume
                            loop: false
                        });
                    }, // Empty callback for now
                    -1, // Never reset
                    false // No interaction required
                );
                this.addTrigger(finalNoteSoundTrigger);
                // Add whisper trigger at cartBridge note location
                const cartBridgeWhisperTrigger = new AreaTrigger(
                    "CartBridgeWhisperTrigger",
                    new THREE.Vector3(-37.82, -0.83, 57.22), // Same as cartBridge note position
                    new THREE.Vector3(5, 5, 5), // 5x5x5 area
                    () => {
                        SoundFX.play('whispering', player.position, {
                            volume: 0.7, // Increased volume
                            loop: false
                        });
                    },
                    -1, // Never reset
                    false // No interaction required
                );
                this.addTrigger(cartBridgeWhisperTrigger);
                const lastTunnelSoundTrigger = new AreaTrigger(
                    "LastTunnelSoundTrigger",
                    new THREE.Vector3(-73.2, 1.13, 46.95), // Same as last tunnel note position
                    new THREE.Vector3(5, 5, 5), // 5x5x5 area
                    () => {
                        SoundFX.play('hiss', EnemyEntity.position, {
                            volume: 0.5, // Increased volume
                            loop: false
                        });
                    }, // Empty callback for now
                    -1, // Never reset
                    false // No interaction required
                );
                this.addTrigger(lastTunnelSoundTrigger);
                Logger.queueLog('Trigger', 'Added sound effect triggers for chase sequence', 'Debug');
            },
            -1, // Never reset
            false // No interaction required
        );
        this.addTrigger(monsterTrigger);

        // Sound Triggers:
        const whisperTrigger = new AreaTrigger(
            "WhisperTrigger",
            new THREE.Vector3(-67.2, -3.2, 50.46), // Position
            new THREE.Vector3(10, 10, 10), // Size (10x10x10 area)
            (context) => {
                // Play whispering sound at trigger position
                SoundFX.play('whispering', new THREE.Vector3(-67.2, -3.2, 50.46), {
                    volume: 0.4,
                    loop: false
                });
                Logger.queueLog('Trigger', 'Whisper sound trigger activated!', 'Debug');
            },
            8 // Reset after 8 seconds
        );
        this.addTrigger(whisperTrigger);
        /*
        const hissTrigger = new AreaTrigger(
            "HissTrigger",
            new THREE.Vector3(-53.50, -3.20, 36.60), // Adjusted Y position up by 2 units
            new THREE.Vector3(10, 10, 10), // Slightly smaller for more precise triggering
            (context) => {
                // Play hiss sound at trigger position with adjusted parameters
                SoundFX.play('hiss', new THREE.Vector3(-53.50, -30, 36.60), {
                    volume: 0.07, // Increased volume
                    loop: false
                });
                Logger.queueLog('Trigger', 'Hiss sound trigger activated!', 'Debug');
                devConsole.log("Hiss trigger activated at position: -53.50, -30, 36.60", "info");
            },
            5 // Reset after 5 seconds
        );
        this.addTrigger(hissTrigger);*/


        // Diray Triggers:
        const storeRoomTrigger = new AreaTrigger(
            "storeRoomTrigger",
            new THREE.Vector3(5.6, 0, 59), // Position as specified
            new THREE.Vector3(1, 2, 1), // Size of trigger area (1x2x1)
            (context) => {
                Game.noteViewer.showNote('storeRoom');
                Logger.queueLog('Trigger', 'Note 2 trigger activated!', 'Debug');
            },
            5, // Reset after 5 seconds
            true // Requires interaction (F key press)
        );

        const cartTrigger = new AreaTrigger(
            "cartTrigger",
            new THREE.Vector3(-37.82, -0.83, 57.22), // Position as specified
            new THREE.Vector3(1, 2, 1), // Size of trigger area (1x2x1)
            (context) => {
                Game.noteViewer.showNote('cartBridge');
                Logger.queueLog('Trigger', 'Note 5 trigger activated!', 'Debug');
            },
            5, // Reset after 5 seconds
            true // Requires interaction (F key press)
        );

        const scaffoldTrigger = new AreaTrigger(
            "scaffoldTrigger",
            new THREE.Vector3(-22.84, 1, 74.30), // Position as specified
            new THREE.Vector3(1, 2, 1), // Size of trigger area (1x2x1)
            (context) => {
                Game.noteViewer.showNote('scaffold');
                Logger.queueLog('Trigger', 'Note 4 trigger activated!', 'Debug');
            },
            5, // Reset after 5 seconds
            true // Requires interaction (F key press)
        );
        this.addTrigger(storeRoomTrigger);
        this.addTrigger(scaffoldTrigger);
        this.addTrigger(cartTrigger);
        const storeRoomTunnelTrigger = new AreaTrigger(
            "storeRoomTunnelTrigger",
            new THREE.Vector3(18.5, 1, 63), // Position as specified
            new THREE.Vector3(1, 2, 1), // Size of trigger area (1x2x1)
            (context) => {
                Game.noteViewer.showNote('storeRoomTunnel');
                Logger.queueLog('Trigger', 'storeRoomTunnel trigger activated!', 'Debug');
            },
            5, // Reset after 5 seconds
            true // Requires interaction (F key press)
        );
        this.addTrigger(storeRoomTunnelTrigger);
        const acroosBridgeTrigger = new AreaTrigger(
            "acroosBridgeTrigger",
            new THREE.Vector3(-60.18, -2.25, 24.18), // Position as specified
            new THREE.Vector3(1, 2, 1), // Size of trigger area (1x2x1)
            (context) => {
                Game.noteViewer.showNote('acrossBridge');
                Logger.queueLog('Trigger', 'storeRoomTunnel trigger activated!', 'Debug');
            },
            5, // Reset after 5 seconds
            true // Requires interaction (F key press)
        );
        this.addTrigger(acroosBridgeTrigger);
        // Final note trigger
        const finalNoteTrigger = new AreaTrigger(
            "finalNoteTrigger",
            new THREE.Vector3(-68.5, -1.27, 75.8), // Position as specified
            new THREE.Vector3(1, 2, 1), // Size of trigger area (1x2x1)
            (context) => {
                Game.noteViewer.showNote('final');
                Logger.queueLog('Trigger', 'Final note trigger activated!', 'Debug');
            },
            5, // Reset after 5 seconds
            true // Requires interaction (F key press)
        );
        this.addTrigger(finalNoteTrigger);
        // Last tunnel note trigger
        const lastTunnelTrigger = new AreaTrigger(
            "lastTunnelTrigger",
            new THREE.Vector3(-73.2, -0.13, 46.95), // Position as specified
            new THREE.Vector3(1, 2, 1), // Size of trigger area (1x2x1)
            (context) => {
                Game.noteViewer.showNote('lastTunnel');
                Logger.queueLog('Trigger', 'Last tunnel note trigger activated!', 'Debug');
            },
            5, // Reset after 5 seconds
            true // Requires interaction (F key press)
        );
        this.addTrigger(lastTunnelTrigger);
    }
    // Level/partition loading:
    loadLevel() {
        this.createTerrain();
        this.addTriggers();

    }
    createTerrain() {
        // Utility function to check if a model is rendered in the scene
        function checkIfModelIsRendered(model, scene, name) {
            if (model && !model.checkComplete) {
                const foundModel = scene.getObjectByName(name); // Use name for identification

                if (foundModel && foundModel.visible) {
                    console.log(`${name} model has been added to the scene and is ready.`);
                    model.checkComplete = true; // Stop checking
                    window.initializationProgress.current++; // Increment progress here
                } else {
                    console.log(`${name} model is still not rendered.`);
                }
            }
        }

        // Utility function to start checking if a model is rendered in the scene
        function checkModelOnNextFrame(model, scene, name) {
            if (!model.checkComplete) {
                requestAnimationFrame(() => checkModelOnNextFrame(model, scene, name)); // Keep checking for the model's rendering
                checkIfModelIsRendered(model, scene, name);
            }
        }

        // Load model function with automatic progress increment
        function loadModel(url, scene, name) {
            const loader = new GLTFLoader();
            let model = null; // Store the loaded model

            loader.load(
                url,
                (gltf) => {
                    model = gltf.scene;
                    // Give the model a name or id for identification
                    model.name = name;
                    // Add the model to the scene
                    this.addObject(scene, model, name);
                    // If this is the ground model, add the entire scene as a floor mesh
                    if (name === 'ground') {
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.receiveShadow = true; // Ground receives shadows
                                child.castShadow = false; // Ground doesn't cast shadows
                                this.addFloorMesh(child);
                                Logger.queueLog('World', `Added ${name} mesh to floor meshes`, 'Initialize');
                            }
                        });
                    } else if (name === 'wallCollider') {
                        model.traverse((child) => {
                            if (child.isMesh) {
                                // Make wall collision mesh invisible
                                child.material.transparent = true;
                                child.material.opacity = 0;
                                child.material.needsUpdate = true;
                                child.castShadow = false; // Walls don't cast shadows
                                child.receiveShadow = false; // Walls don't receive shadows
                                this.addWallMesh(child);
                                Logger.queueLog('World', `Added ${name} mesh to wall meshes`, 'Initialize');
                                Logger.queueLog('World', `Wall collider shadow properties set: castShadow=${child.castShadow}, receiveShadow=${child.receiveShadow}`, 'Initialize');
                            }
                        });
                    }

                    // Apply shadow properties to ALL models except ground and wallCollider
                    if (name !== 'ground' && name !== 'wallCollider') {
                        // For all other models, enable shadow casting and receiving
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                Logger.queueLog('World', `Set shadow properties for model mesh ${child.name}:`, 'Debug');
                                Logger.queueLog('World', `- castShadow: ${child.castShadow}`, 'Debug');
                                Logger.queueLog('World', `- receiveShadow: ${child.receiveShadow}`, 'Debug');
                                Logger.queueLog('World', `- material type: ${child.material.type}`, 'Debug');
                                if (child.material.transparent) {
                                    Logger.queueLog('World', `- material is transparent`, 'Debug');
                                }
                            }
                        });
                    }
                    // Log the model loading success
                    Logger.queueLog('World', `${name} model loaded successfully`, 'Initialize');
                    // Start checking if the model is rendered on the next frame
                    checkModelOnNextFrame(model, scene, name);
                },
                undefined,
                (error) => {
                    Logger.queueLog('World', `Error loading ${name} model: ${error}`, 'Error');
                }
            );
        }

        // Usage for different models
        // Load ground model
        loadModel.call(this, 'https://play.rosebud.ai/assets/floorMesh.glb?MN1D', WorldScene, 'ground');
        // Load walls
        loadModel.call(this, 'https://play.rosebud.ai/assets/wallCollider.glb?df6L', WorldScene, 'wallCollider');

        // Load entrance
        loadModel.call(this, 'https://play.rosebud.ai/assets/entrance.glb?dG78', WorldScene, 'entrance');
        loadModel.call(this, 'https://play.rosebud.ai/assets/entranceObjects.glb?Z8EG', WorldScene, 'entranceObjects');

        // Main cave
        loadModel.call(this, 'https://play.rosebud.ai/assets/mainCave.glb?DQw5', WorldScene, 'mainCave');

        // Load scaffold
        loadModel.call(this, 'https://play.rosebud.ai/assets/scaffold.glb?XnpI', WorldScene, 'scaffold');
        loadModel.call(this, 'https://play.rosebud.ai/assets/scaffoldObjects.glb?DJBf', WorldScene, 'scaffoldObjects');

        // Store room
        loadModel.call(this, 'https://play.rosebud.ai/assets/storeRoom.glb?zaDg', WorldScene, 'storeRoom');
        loadModel.call(this, 'https://play.rosebud.ai/assets/storeRoomObjects.glb?ATcW', WorldScene, 'storeRoomObjects');
        loadModel.call(this, 'https://play.rosebud.ai/assets/endRoom.glb?lcEG', WorldScene, 'endRoom');


        Logger.queueLog('World', 'Ground plane created', 'Initialize');
        this.dependencyChecker.readyToRegister = true;


    }
    // Object Management: 
    addObject(scene, object, name, isFloor = false) {
        scene.add(object);
        if (name) {
            this.objects.set(name, object);
            Logger.queueLog('World', `Added object "${name}" to scene and registry`, 'Objects');
        }
        if (isFloor) {
            this.floorMeshes.push(object);
            Logger.queueLog('World', `Added floor mesh "${name}" to floor registry`, 'Objects');
        }
        return object;
    }
    getObject(identifier) {
        if (typeof identifier === 'string') {
            // Get by name
            return this.objects.get(identifier);
        } else {
            // Get by direct reference
            for (let [name, obj] of this.objects.entries()) {
                if (obj === identifier) {
                    return obj;
                }
            }
        }
        return null;
    }
    removeObject(identifier) {
        const object = this.getObject(identifier);
        if (object) {
            if (object.parent) {
                object.parent.remove(object);
            }
            if (typeof identifier === 'string') {
                this.objects.delete(identifier);
            } else {
                for (let [name, obj] of this.objects.entries()) {
                    if (obj === identifier) {
                        this.objects.delete(name);
                        break;
                    }
                }
            }
            Logger.queueLog('World', `Removed object from scene and registry`, 'Objects');
            return true;
        }
        return false;
    }
    addWallMesh(mesh) {
        if (!this.wallMeshes.includes(mesh)) {
            this.wallMeshes.push(mesh);
            Logger.queueLog('World', `Added wallCillider mesh to registry`, 'Objects');
        }
    }
    addFloorMesh(mesh) {
        if (!this.floorMeshes.includes(mesh)) {
            this.floorMeshes.push(mesh);
            Logger.queueLog('World', `Added floor mesh to registry`, 'Objects');
        }
    }
    removeFloorMesh(mesh) {
        const index = this.floorMeshes.indexOf(mesh);
        if (index !== -1) {
            this.floorMeshes.splice(index, 1);
            Logger.queueLog('World', `Removed floor mesh from registry`, 'Objects');
        }
    }
    getFloorMeshes() {
        return this.floorMeshes;
    }
    // Fog control methods
    setFogDensity(density) {
        if (WorldScene.fog) {
            this.fogSettings.density = density;
            WorldScene.fog.density = density;
            devConsole.log(`Fog density set to: ${density}`, "info");
        }
    }
    setFogColor(color) {
        if (WorldScene.fog) {
            this.fogSettings.color = color;
            WorldScene.fog.color.setHex(color);
            devConsole.log(`Fog color set to: ${color.toString(16)}`, "info");
        }
    }
    toggleFog() {
        this.fogSettings.enabled = !this.fogSettings.enabled;
        if (this.fogSettings.enabled) {
            WorldScene.fog = new THREE.FogExp2(this.fogSettings.color, this.fogSettings.density);
            devConsole.log("Fog enabled", "info");
        } else {
            WorldScene.fog = null;
            devConsole.log("Fog disabled", "info");
        }
    }
    getFogSettings() {
        return this.fogSettings;
    }
    addTrigger(trigger) {
        this.triggers.push(trigger);
        GameWorld.addObject(WorldScene, trigger.mesh, 'trigger_' + this.triggers.length);
        Logger.queueLog('World', 'Added new area trigger', 'Triggers');
        // Set initial visibility based on current state
        trigger.mesh.material.visible = this.isTriggersVisible;
    }
    toggleTriggerVisibility() {
        this.isTriggersVisible = !this.isTriggersVisible;
        this.triggers.forEach(trigger => {
            if (trigger.mesh) {
                trigger.mesh.material.visible = this.isTriggersVisible;
            }
        });
        devConsole.log(`Trigger visualization ${this.isTriggersVisible ? 'enabled' : 'disabled'}`, "info");
    }
    removeTrigger(trigger) {
        const index = this.triggers.indexOf(trigger);
        if (index !== -1) {
            trigger.dispose();
            this.triggers.splice(index, 1);
            Logger.queueLog('World', 'Removed area trigger', 'Triggers');
        }
    }
    checkTriggers(position) {
        if (!position) return;
        const playerBox = new THREE.Box3();
        playerBox.setFromCenterAndSize(
            position,
            new THREE.Vector3(1, 2, 1) // Approximate player collision size
        );
        let triggersChecked = 0;
        let triggersActivated = 0;
        this.triggers.forEach(trigger => {
            triggersChecked++;
            const isIntersecting = trigger.boundingBox.intersectsBox(playerBox);
            if (isIntersecting) {
                // Mark the player as inside the trigger
                if (!trigger.playerInside) {
                    trigger.playerInside = true;
                    devConsole.log(`Player entered trigger '${trigger.name}'`, "debug");
                    // Show interaction prompt if trigger requires interaction and wasn't just activated
                    if (trigger.requiresInteraction && trigger.isActive) {
                        Game.interactionPrompt.show();
                    }
                }

                // Only attempt to trigger if it's active
                if (trigger.isActive) {
                    trigger.trigger(this);
                    if (!trigger.isActive) { // If trigger was activated
                        triggersActivated++;
                    }
                }
            } else if (!isIntersecting && trigger.playerInside) {
                // Player has left the trigger area
                trigger.playerLeft();

                // Hide interaction prompt if this was an interaction trigger
                if (trigger.requiresInteraction) {
                    Game.interactionPrompt.hide();
                }
            }
        });
        if (triggersActivated > 0) {
            devConsole.log(`Checked ${triggersChecked} triggers, activated ${triggersActivated}`, "info");
        }
    }
    // General: -->
    update(deltaTime) {
        if (GAME_READY == true) {
            // Update player
            if (player) {
                player.update(deltaTime);
            }
            GameRenderer.render();
        }
    }
    clear() {
        Logger.queueLog('World', 'Clearing WorldScene...', 'Clear');
        // Clear objects registry
        this.objects.clear();
        // Remove all objects from the scene without disposing materials
        while (WorldScene.children.length > 0) {
            const object = WorldScene.children[0];
            GameWorld.removeObject(object);
        }

        // Clear the lighting
        Lights.clearAll();

        // Re-create essential scene elements
        this.createSunlight();

        Logger.queueLog('World', 'WorldScene cleared successfully', 'Clear');
    }
}
// Game Objects:
//============================================================
class EndScreenDisplay extends HTMLElement {
    constructor() {
        super();
        this.style.position = 'absolute';
        this.style.top = '0';
        this.style.left = '0';
        this.style.width = '100%';
        this.style.height = '100%';
        this.style.backgroundColor = '#000000'; // Fully opaque black
        this.style.display = 'none';
        this.style.zIndex = '300';
        this.style.color = 'white';
        this.style.fontFamily = 'Arial, sans-serif';
        this.style.userSelect = 'none';
        this.style.margin = '0';
        this.style.padding = '0';
        // Create a single container for all content
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.textAlign = 'center';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';
        this.container.style.gap = '1rem';
        this.container.style.margin = '0';
        this.container.style.padding = '0';
        // Create message container
        this.message = document.createElement('div');
        this.message.style.fontSize = '3rem';
        this.message.style.marginBottom = '0.5rem';
        this.message.textContent = 'Farewell Reader'; // Default title
        // Create note container
        this.note = document.createElement('div');
        this.note.style.fontSize = '1.2rem';
        this.note.style.marginBottom = '1rem';
        this.note.style.padding = '0 20%';
        this.note.style.lineHeight = '1.6';
        this.note.style.textAlign = 'left';
        this.note.style.fontFamily = 'Arial, sans-serif';
        this.note.style.color = '#ffffff';
        this.note.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)';
        this.note.style.whiteSpace = 'pre-wrap'; // Preserve line breaks and spacing
        // Create restart button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Game';
        restartButton.style.padding = '0.5rem 1rem';
        restartButton.style.fontSize = '1.5rem';
        restartButton.style.backgroundColor = 'transparent';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderBottom = '2px solid white'; // Stylish underline
        restartButton.style.cursor = 'pointer';
        restartButton.style.transition = 'border-color 0.3s, color 0.3s';
        // Add hover effect
        restartButton.addEventListener('mouseenter', () => {
            restartButton.style.borderBottomColor = '#e74c3c'; // Red underline on hover
            restartButton.style.color = '#e74c3c'; // Red text on hover
        });
        restartButton.addEventListener('mouseleave', () => {
            restartButton.style.borderBottomColor = 'white'; // Reset underline color
            restartButton.style.color = 'white'; // Reset text color
        });
        // Add click handler
        restartButton.addEventListener('click', () => {
            location.reload(); // Simple reload for now
        });
        // Append elements to container
        this.container.appendChild(this.message);
        this.container.appendChild(this.note);
        this.container.appendChild(restartButton);
        // Append container to the end screen
        this.appendChild(this.container);
    }
    showFarewell() {
        this.message.textContent = 'Farewell Reader';
        this.note.textContent = window.fareWellNote;
        this.show();
    }
    showEscape() {
        this.message.textContent = 'You Escaped!';
        this.note.textContent = window.escapeNote;
        this.show();
    }
    show() {
        this.style.display = 'block';
        this.style.zIndex = '300'; // Bring to top
        // Add fade-in animation
        this.style.opacity = '0';
        this.style.transition = 'opacity 0.5s ease-in';
        requestAnimationFrame(() => {
            this.style.opacity = '1';
        });
    }
}
customElements.define('end-screen', EndScreenDisplay);

// Main Game Instance:
class App {
    constructor() {
        this.createRenderDivs();
        this.clock = new THREE.Clock();
        // Initialize sound effect player
        this.deltaTime = 0;
        this.resizeObserver = null;
        this.isPaused = false;

        this.init();
    }
    // Initialization:
    init() {

        this.settingsMenu = null; // Reference to settings menu
        window.Textures = new BGE.TextureManager();
        window.Materials = new BGE.MaterialManager();
        window.Meshes = new BGE.MeshManager();
        window.Lights = new BGE.LightingManager();
        window.GameWorld = new World();
        window.player = new BGE.Player();
        window.Input = new BGE.InputHandler();
        window.Sound = new SoundManager();
        window.SoundFX = new HowlerSoundManager();
        window.FarGosts = new FarGhosts();
        // Create loading screen and main menu
        const loadingScreen = new BGE.LoadingScreen();
        loadingScreen.showTips = true;
        const mainMenu = new BGE.MainMenu();

        // Start playing menu theme
        this.settingsMenu = new BGE.SettingsMenu(); // Store reference to settings menu
        this.pauseMenu = new BGE.PauseMenu(); // Create pause menu
        this.noteViewer = new BGE.NoteViewer(); // Create note viewer
        this.interactionPrompt = new InteractionPrompt(); // Create interaction prompt
        const keyMapper = new BGE.KeyMapper();
        keyMapper.style.display = 'none';
        // Set explicit z-index
        loadingScreen.style.zIndex = '200';
        mainMenu.style.zIndex = '100';
        this.settingsMenu.style.zIndex = '150';
        this.pauseMenu.style.zIndex = '160';
        this.interactionPrompt.style.zIndex = '170';
        keyMapper.style.zIndex = '175';
        // Add UI elements in order of z-index (lowest first)
        uiDiv.appendChild(mainMenu);
        uiDiv.appendChild(this.settingsMenu);
        uiDiv.appendChild(this.pauseMenu);
        uiDiv.appendChild(this.noteViewer);
        uiDiv.appendChild(this.interactionPrompt);
        uiDiv.appendChild(keyMapper);
        uiDiv.appendChild(loadingScreen);

        // Store reference to keyMapper
        this.keyMapper = keyMapper;
        this.initDevConsole();
        // Create and add death screen
        window.EndScreen = new EndScreenDisplay();
        uiDiv.appendChild(EndScreen);
        // Start fake loading
        loadingScreen.fakeLoad(25000, true);
        //loadingScreen.load(window.initializationProgress, window.initializationProgress.target);
        uiDiv.style.pointerEvents = 'auto'; // Enable pointer events for the UI after loading
        // Add delay before setting game ready
        setTimeout(() => {
            window.GAME_READY = true;
            Sound.playSong('menuTheme');
            window.EnemyEntity = new BGE.Enemy(WorldScene);
            this.addEventListeners();
            Logger.queueLog('System', 'Game Ready!', 'Initialize');
            // Play drip sound effect once game is ready
            SoundFX.play('drip', null, {
                volume: 0.3,
                loop: false
            });
            // Start traps sound interval
            this.trapsInterval = setInterval(() => {
                SoundFX.play('traps', null, {
                    volume: 0.2,
                    loop: false
                });
                Logger.queueLog('SoundFX', 'Playing traps sound effect', 'Debug');
                // Start eerieWind sound effect with a random delay between 10-15 seconds
                const eerieWindDelay = Math.floor(Math.random() * 5000) + 10000; // Random delay between 10-15 seconds
                setTimeout(() => {
                    SoundFX.play('eerieWind', null, {
                        volume: 0.2,
                        loop: false
                    });
                    Logger.queueLog('SoundFX', `Playing eerieWind sound effect after ${eerieWindDelay / 1000} seconds`, 'Debug');
                }, eerieWindDelay);
            }, Math.floor(Math.random() * 60000) + 40000); // Random interval between 100-105 seconds
            const contextPointers = [{
                name: 'EndScreen',
                pointer: window.EndScreen
            }, {
                name: 'Enemy',
                pointer: window.EnemyEntity
            }, {
                name: 'WorldScene',
                pointer: window.WorldScene
            }, {
                name: 'Sound',
                pointer: window.Sound
            }, {
                name: 'App',
                pointer: this
            }, {
                name: 'Lights',
                pointer: window.Lights
            }, {
                name: 'Input',
                pointer: window.Input
            }, {
                name: 'GameWorld',
                pointer: window.GameWorld
            }, {
                name: 'MainCamera',
                pointer: window.MainCamera,
            }, {
                name: 'Meshes',
                pointer: window.Meshes
            }, {
                name: 'Materials',
                pointer: window.Materials
            }, {
                name: 'Textures',
                pointer: window.Textures
            }, {
                name: 'Player',
                pointer: window.player
            }, {
                name: 'NoteViewer',
                pointer: this.noteViewer
            }, {
                name: 'PauseMenu',
                pointer: this.pauseMenu
            }, {
                name: 'SettingsMenu',
                pointer: this.settingsMenu
            }, {
                name: 'GameRenderer',
                pointer: window.GameRenderer
            }];
            // Add contexts using DevConsole's method
            devConsole.addContextsFromList(contextPointers);
            // Initialize HowlSounds and play scary drone sound
            //window.HowlSounds = new HowlerSoundManager();
            SoundFX.init();
            SoundFX.loadSound('whispering', 'https://play.rosebud.ai/assets/CreepyWhispering.mp3?oaJD', 'ambiance');
            SoundFX.loadSound('hiss', 'https://play.rosebud.ai/assets/Hiss.mp3?Ss63', 'ambiance');
            SoundFX.loadSound('caveWind1', 'https://play.rosebud.ai/assets/Cavewind1.mp3?9sLb', 'ambiance');
            SoundFX.loadSound('traps', 'https://play.rosebud.ai/assets/traps.mp3?QsfS', 'ambiance');
            SoundFX.loadSound('eerieWind', 'https://play.rosebud.ai/assets/eerieWind.mp3?Z1dY', 'ambiance');
            SoundFX.loadSound('monsterChase', 'https://play.rosebud.ai/assets/monsterchase.mp3?dnP3', 'ambiance');

            https: //play.rosebud.ai/assets/eerieWind.mp3?Z1dY
                SoundFX.loadSound('drip', 'https://play.rosebud.ai/assets/dripmp3-14875.mp3?oSZr', 'ambiance')
                .then(() => {
                    SoundFX.play('drip', null, {
                        volume: 0.1,
                        loop: true
                    });
                });

            SoundFX.loadSound('footstep', 'https://play.rosebud.ai/assets/Concrete 1.wav?unDD', 'ambiance');
            SoundFX.loadSound('scaryDrone', 'https://play.rosebud.ai/assets/ScaryDrone.mp3?dTEZ', 'ambiance')
                .then(() => {
                    SoundFX.play('scaryDrone', null, {
                        volume: 0.005,
                        loop: true
                    });
                });
        }, 8000);
    }
    initDevConsole() {
        window.devConsole = new THREEDEV.DevConsole();
        uiDiv.appendChild(devConsole);
    }
    createRenderDivs() {
        // Can create global variables by assigning them to window.variableName. 
        window.parentDiv = document.getElementById('renderDiv');
        if (!parentDiv) {
            console.error('Parent div not found!');
            return;
        }

        // Create canvas if it doesn't exist
        window.canvas = document.getElementById('threeRenderCanvas');
        if (!canvas) {
            window.canvas = document.createElement('canvas');
            canvas.id = 'threeRenderCanvas';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '0';
            parentDiv.appendChild(canvas);
        }
        // Disable context menu for game elements
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        parentDiv.addEventListener('contextmenu', (e) => e.preventDefault());


        window.uiDiv = document.createElement('div');
        uiDiv.id = 'uiDiv';
        uiDiv.style.position = 'absolute';
        uiDiv.style.top = '0';
        uiDiv.style.left = '0';
        uiDiv.style.width = '100%';
        uiDiv.style.height = '100%';
        uiDiv.style.pointerEvents = 'auto'; // Allow UI interactions by default
        uiDiv.style.userSelect = 'none';
        uiDiv.style.webkitUserSelect = 'none';
        uiDiv.style.msUserSelect = 'none';

        // Apply the same styles to parentDiv
        parentDiv.style.userSelect = 'none';
        parentDiv.style.webkitUserSelect = 'none';
        parentDiv.style.msUserSelect = 'none';

        parentDiv.appendChild(uiDiv);
    }
    addEventListeners() {
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Create and configure ResizeObserver
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === parentDiv) {
                    const width = entry.contentRect.width;
                    const height = entry.contentRect.height;

                    if (window.MainCamera && window.GameRenderer) {
                        // Update renderer size
                        window.GameRenderer.renderer.setSize(width, height);
                        // Update composer size if it exists
                        if (window.GameRenderer.composer) {
                            window.GameRenderer.composer.setSize(width, height);
                        }
                        // Update camera aspect ratio
                        window.MainCamera.aspect = width / height;
                        window.MainCamera.updateProjectionMatrix();
                    }
                }
            }
        });

        // Start observing
        this.resizeObserver.observe(parentDiv);
    }
    onWindowResize() {
        if (!GAME_READY) return;

        const width = parentDiv.clientWidth;
        const height = parentDiv.clientHeight;

        // Update renderer and canvas size
        window.GameRenderer.renderer.setSize(width, height, false);

        // Update composer size
        if (window.GameRenderer.composer) {
            window.GameRenderer.composer.setSize(width, height);
        }

        // Update camera
        window.MainCamera.aspect = width / height;
        window.MainCamera.updateProjectionMatrix();

        // Update pixel ratio
        const pixelRatio = window.devicePixelRatio;
        window.GameRenderer.renderer.setPixelRatio(pixelRatio);

    }
    // Pointerlock functions:
    lockPointer() {
        // First ensure canvas has focus
        canvas.focus();

        const isCurrentlyLocked = document.pointerLockElement === canvas;

        // Only request if not already locked
        if (!isCurrentlyLocked) {
            console.log("Attempting to lock pointer");
            try {
                canvas.requestPointerLock();

                // Add pointer lock change event listener
                document.addEventListener('pointerlockchange', () => {
                    const lockState = document.pointerLockElement === canvas;
                    if (!Game.isPaused) {
                        // If pointer was unlocked by ESC and game isn't paused, pause the game
                        //Game.pauseGame(true, false);
                    }
                    console.log(`Pointer lock state changed to: ${lockState}`);
                    devConsole.log(`Pointer lock state changed to: ${lockState}`, lockState ? "info" : "warn");
                });
            } catch (error) {
                console.error(`Error requesting pointer lock: ${error}`);
                devConsole.log(`Error requesting pointer lock: ${error}`, "error");
            }
        }
    }

    unlockPointer() {
        if (document.pointerLockElement) {
            console.log("Unlocking pointer");
            document.exitPointerLock();
            console.log("Pointer lock disabled");
            devConsole.log("Pointer lock disabled", "info");
        }
    }
    togglePointerLock() {
        const currentState = document.pointerLockElement === canvas;
        console.log(`Toggling pointer lock. Current state: ${currentState}`);
        devConsole.log(`Toggling pointer lock. Current state: ${currentState}`, "info");
        if (currentState) {
            this.unlockPointer();
        } else {
            this.lockPointer();
        }
    }
    // Pause Functions:
    pauseGame(showPauseMenu = true, lockPointer = true) {
        if (!this.isPaused) {
            if (showPauseMenu) {
                this.pauseMenu.show();
            }
            const pointerStateBefore = document.pointerLockElement === canvas;
            if (lockPointer) {
                this.unlockPointer();
            }
            // Pause the current song
            if (Sound) {
                Sound.pauseSong();
            }
            this.isPaused = true;
            const pointerStateAfter = document.pointerLockElement === canvas;
            if (pointerStateBefore !== pointerStateAfter) {
                devConsole.log(`Game paused. Pointer lock changed from ${pointerStateBefore} to ${pointerStateAfter}`, "info");
            }
        }
    }
    unpauseGame() {
        if (this.isPaused) {
            this.pauseMenu.hide();
            const pointerStateBefore = document.pointerLockElement === canvas;
            this.lockPointer();
            this.isPaused = false;
            // Resume the current song if exists and enabled

            // Only check and log if state actually changed
            setTimeout(() => {
                const pointerStateAfter = document.pointerLockElement === canvas;
                if (pointerStateBefore !== pointerStateAfter) {
                    devConsole.log(`Game unpaused. Pointer lock changed from ${pointerStateBefore} to ${pointerStateAfter}`, "info");
                }
            }, 100);
        }
    }
    togglePause(showPauseMenu = true) {
        if (this.isPaused) {
            this.unpauseGame(showPauseMenu);
        } else {
            this.pauseGame(showPauseMenu);
        }
    }
    // Main App functions:
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.deltaTime = Math.min(this.clock.getDelta(), 0.1);
        window.DeltaTime = this.deltaTime;
        // Only run game logic if explicitly ready
        if (window.GAME_READY === true) {
            if (!this.isPaused) {
                if (GameWorld) GameWorld.update(this.deltaTime);
                if (Input) Input.update(this.deltaTime);
                if (EnemyEntity) EnemyEntity.update(this.deltaTime);
                if (FarGosts) FarGosts.update(this.deltaTime); // Update FarGhosts
            }
        }
    }
    start() {
        this.animate();
    }
    // Test function to manually trigger traps sound
    playTrapsSound() {
        SoundFX.play('traps', null, {
            volume: 0.1,
            loop: false
        });
        Logger.queueLog('SoundFX', 'Manually triggered traps sound effect', 'Debug');
    }
}

class WarningDisplay extends HTMLElement {
    constructor() {
        super();
        this.style.position = 'absolute';
        this.style.top = '50%';
        this.style.left = '50%';
        this.style.transform = 'translate(-50%, -50%)';
        this.style.display = 'none';
        this.style.zIndex = '310'; // Higher than EndScreen
        this.style.color = 'rgba(255, 255, 255, 0.8)'; // Slightly transparent white
        this.style.fontFamily = 'Arial, sans-serif';
        this.style.fontSize = '2rem';
        this.style.textAlign = 'center';
        this.style.userSelect = 'none';
        this.style.pointerEvents = 'none'; // Prevent interaction
        this.textContent = 'Get back to the beginning!';
    }
    show() {
        this.style.display = 'block';
        this.style.opacity = '1';
        // Automatically hide after 3 seconds
        setTimeout(() => {
            this.style.opacity = '0';
            setTimeout(() => {
                this.style.display = 'none';
            }, 500); // Fade-out duration
        }, 3000); // Display duration
    }
}
customElements.define('warning-display', WarningDisplay);

window.Game = new App();
// Create and add main menu to the UI div after game initialization
Game.start();