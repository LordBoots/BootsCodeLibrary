const DEFAULT_SKY_SHADER = {
    uniforms: {
        topColor: {
            value: new THREE.Color(0x87CEEB)
        }, // Default sky color
        bottomColor: {
            value: new THREE.Color(0xdefeff)
        }, // Default ground color
        sunPosition: {
            value: new THREE.Vector3(0, 1, 0)
        },
        sunColor: {
            value: new THREE.Color(1, 1, 0.4)
        },
        offset: {
            value: 0.4
        },
        exponent: {
            value: 0.8
        },
        horizonLevel: {
            value: 0.0
        },
        sunSideIntensity: {
            value: 0.6
        },
        sunFadeFactor: {
            value: 1.0
        },
        sunIntensity: {
            value: 0.6
        },
        coronaSize: {
            value: 0.2
        },
        tendrilFactor: {
            value: 0.3
        },
        tendrilSpeed: {
            value: 1.0
        },
        time: {
            value: 0.0
        },
        sunAngularDiameter: {
            value: 1.0
        },
        sunCoronaOuterEdge: {
            value: 1.0
        },
        coronaColorMix: {
            value: 0.7
        },
        coronaTint: {
            value: new THREE.Color(1.0, 0.7, 0.7)
        },
        sunCoreVisibilityThreshold: {
            value: 0.4
        },
        noiseScale: {
            value: 1.0
        },
        tendrilAmplitude: {
            value: 0.7
        }
    },
    vertexShader: `
        // 3D Noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            
            // First corner
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            
            // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            
            // Permutations
            i = mod289(i);
            vec4 p = permute(permute(permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0))
                     + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                     + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                     
            // Gradients: 7x7 points over a square, mapped onto an octahedron.
            // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
            float n_ = 0.142857142857; // 1.0/7.0
            vec3 ns = n_ * D.wyz - D.xzx;
            
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
            
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)
            
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
            
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            
            // Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            
            // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        float fbm(vec3 x) {
            float v = 0.0;
            float a = 0.5;
            vec3 shift = vec3(100);
            for (int i = 0; i < 5; ++i) {
                v += a * snoise(x);
                x = x * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        
        // Simple 2D noise function
        float noise(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(normalize(position), 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
    fragmentShader: `
        // 3D Noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            
            // First corner
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            
            // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            
            // Permutations
            i = mod289(i);
            vec4 p = permute(permute(permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0))
                     + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                     + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                     
            // Gradients: 7x7 points over a square, mapped onto an octahedron.
            // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
            float n_ = 0.142857142857; // 1.0/7.0
            vec3 ns = n_ * D.wyz - D.xzx;
            
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
            
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)
            
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
            
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            
            // Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            
            // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        float fbm(vec3 x) {
            float v = 0.0;
            float a = 0.5;
            vec3 shift = vec3(100);
            for (int i = 0; i < 5; ++i) {
                v += a * snoise(x);
                x = x * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        
        // Simple 2D noise function
        float noise(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 sunPosition;
        uniform vec3 sunColor;
        uniform float offset;
        uniform float exponent;
        uniform float horizonLevel;
        uniform float sunSideIntensity;
        uniform float sunFadeFactor;
        uniform float sunIntensity;
        uniform float coronaSize;
        uniform float tendrilFactor;
        uniform float tendrilSpeed;
        uniform float time;
        uniform float sunAngularDiameter;
        uniform float sunCoronaOuterEdge;
        uniform float coronaColorMix;
        uniform vec3 coronaTint;
        uniform float sunCoreVisibilityThreshold;
        uniform float noiseScale;
        uniform float tendrilAmplitude;
        varying vec3 vWorldPosition;
        
        vec4 renderClouds(vec3 viewDirection) {
            const float CLOUD_BOTTOM = 6.0;
            const float CLOUD_HEIGHT = 0.8;
            const float CLOUD_DENSITY = 0.3;
            const float CLOUD_SCALE = 0.2;
            const float CLOUD_SPEED = 0.05;
            const float CLOUD_EDGE_SHARPNESS = 0.5;
            const float CLOUD_COLOR_MIX = 0.7;
            
            float t = (CLOUD_BOTTOM - viewDirection.y) / viewDirection.y;
            if (t < 0.0) return vec4(0.0);
            
            vec3 cloudPos = vec3(viewDirection.x * t, CLOUD_BOTTOM, viewDirection.z * t) * CLOUD_SCALE;
            float density = fbm(cloudPos + time * CLOUD_SPEED);
            
            density = smoothstep(CLOUD_EDGE_SHARPNESS - CLOUD_DENSITY, CLOUD_EDGE_SHARPNESS, density) * CLOUD_HEIGHT;
            density *= (1.0 - smoothstep(CLOUD_BOTTOM, CLOUD_BOTTOM + CLOUD_HEIGHT, viewDirection.y));
            
            vec3 cloudColor = mix(bottomColor, vec3(1.0), CLOUD_COLOR_MIX);
            return vec4(cloudColor, density);
        }
        
        vec4 renderLargeClouds(vec3 viewDirection) {
            const float LARGE_CLOUD_BOTTOM = 11.0;
            const float LARGE_CLOUD_HEIGHT = 1.0;
            const float LARGE_CLOUD_DENSITY = 0.5;
            const float LARGE_CLOUD_SCALE = 0.05;
            const float LARGE_CLOUD_SPEED = 0.02;
            const float LARGE_CLOUD_EDGE_SHARPNESS = 0.4;
            const float LARGE_CLOUD_COLOR_MIX = 0.7;
            
            float t = (LARGE_CLOUD_BOTTOM - viewDirection.y) / viewDirection.y;
            if (t < 0.0) return vec4(0.0);
            
            vec3 cloudPos = vec3(viewDirection.x * t, LARGE_CLOUD_BOTTOM, viewDirection.z * t) * LARGE_CLOUD_SCALE;
            float density = fbm(cloudPos + time * LARGE_CLOUD_SPEED);
            
            density = smoothstep(LARGE_CLOUD_EDGE_SHARPNESS - LARGE_CLOUD_DENSITY, LARGE_CLOUD_EDGE_SHARPNESS, density) * LARGE_CLOUD_HEIGHT;
            density *= (1.0 - smoothstep(LARGE_CLOUD_BOTTOM, LARGE_CLOUD_BOTTOM + LARGE_CLOUD_HEIGHT, viewDirection.y));
            
            vec3 cloudColor = mix(bottomColor, vec3(1.0), LARGE_CLOUD_COLOR_MIX);
            return vec4(cloudColor, density * 0.6);
        }
        
        vec3 calculateSkyGradient(vec3 viewDirection) {
            const float HORIZON_SHARPNESS = 0.8;
            const float MIN_GRADIENT_HEIGHT = 0.0;
            
            float heightAboveHorizon = viewDirection.y - horizonLevel;
            float gradientFactor = pow(max(heightAboveHorizon, MIN_GRADIENT_HEIGHT), HORIZON_SHARPNESS);
            return mix(bottomColor, topColor, gradientFactor);
        }
        
        vec3 calculateSunGradient(vec3 viewDirection) {
            const float SUN_ANGULAR_DIAMETER = 0.04;
            const float SUN_CORONA_OUTER_EDGE = SUN_ANGULAR_DIAMETER * 2.0;
            const float CORONA_COLOR_MIX = 0.3;
            const vec3 CORONA_TINT = vec3(1.0, 0.8, 0.8);
            const float SUN_CORE_VISIBILITY_THRESHOLD = 1.0;
            const float NOISE_SCALE = 0.4;
            const float TENDRIL_AMPLITUDE = 0.4;
            
            float cosAngle = dot(sunPosition, normalize(viewDirection));
            float sunVisibility = smoothstep(cos(SUN_CORONA_OUTER_EDGE), SUN_CORE_VISIBILITY_THRESHOLD, cosAngle);
            
            float angleFromSunCenter = atan(viewDirection.y - sunPosition.y, normalize(viewDirection).x - sunPosition.x);
            const float NOISE_AMPLITUDE = 2.0;
            float noiseOffset = noise(vec2(angleFromSunCenter * NOISE_SCALE, time * NOISE_SCALE)) * NOISE_AMPLITUDE - (NOISE_AMPLITUDE * 0.5);
            float tendrilEffect = sin(tendrilFactor * (angleFromSunCenter + noiseOffset) + time * tendrilSpeed) * TENDRIL_AMPLITUDE;
            float coronaEdgeAngle = cos(SUN_ANGULAR_DIAMETER * (coronaSize + tendrilEffect));
            float sunCoreVisibility = smoothstep(coronaEdgeAngle, cos(SUN_ANGULAR_DIAMETER), cosAngle);
            
            vec3 sunCoreColor = sunColor * sunIntensity;
            vec3 coronaColor = mix(sunColor, CORONA_TINT, CORONA_COLOR_MIX);
            
            return mix(coronaColor, sunCoreColor, sunCoreVisibility) * sunVisibility;
        }
        
        vec3 blendSkyAndSun(vec3 skyColor, vec3 sunColor, vec3 viewDirection) {
            float sunInfluence = dot(normalize(viewDirection), sunPosition);
            sunInfluence = pow(max(0.0, sunInfluence), sunFadeFactor);
            
            float sunVisibility = smoothstep(0.995, 1.0, sunInfluence);
            
            vec3 blendedColor = mix(skyColor, sunColor, sunVisibility);
            
            float glow = pow(max(0.0, sunInfluence), 4.0) * sunSideIntensity;
            blendedColor += sunColor * glow;
            
            return blendedColor;
        }
        
        void main() {
            vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
            
            vec3 skyColor = calculateSkyGradient(viewDirection);
            vec3 sunColor = calculateSunGradient(viewDirection);
            
            vec3 blendedColor = blendSkyAndSun(skyColor, sunColor, viewDirection);
            
            vec4 smallClouds = renderClouds(viewDirection);
            vec4 largeClouds = renderLargeClouds(viewDirection);
            
            vec3 cloudColor = mix(blendedColor, largeClouds.rgb, largeClouds.a);
            cloudColor = mix(cloudColor, smallClouds.rgb, smallClouds.a);
            
            gl_FragColor = vec4(cloudColor, 1.0);
        }`
};