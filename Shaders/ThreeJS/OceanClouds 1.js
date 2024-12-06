const sea = {
    uniforms: {
        iTime: {
            value: 0
        },
        iResolution: {
            value: new THREE.Vector2()
        },
        iChannel0: {
            value: null
        },
        _SkySettngs: {
			// Sky Category
            value: 1.0
        }, 
        uRenderGodrays: {
            value: 1
        },
        uCloudHeight: {
            value: 350.0
        },
        uCloudBottomHeight: {
            value: 250.0
        },
        uRenderClouds: {
            value: 1
        },
        uFogColor: {
            value: new THREE.Color(0.5, 0.7, 1.1)
        },
        uSkyBottom: {
            value: new THREE.Color(0.6, 0.8, 1.2)
        },
        uSkyTop: {
            value: new THREE.Color(0.05, 0.2, 0.5)
        },
        uLightDirection: {
            value: new THREE.Vector3(0.1, 0.0, 0.9).normalize()
        },
        uFresnelStrength: {
            value: 0.7
        },
        uSunHeight: {
            value: 0.25
        },
        _OceanSettings: {
		// Ocean Category
            value: 1.0
        }, 
        uWaveHeight: {
            value: 0.6 // default SEA_HEIGHT
        },
        uWaveSpeed: {
            value: 0.8 // default SEA_SPEED
        },
        uWaveChoppy: {
            value: 4.0 // default SEA_CHOPPY
        },
        uWaterColor: {
            value: new THREE.Color(0.8, 0.9, 0.6)
        },
        uWaterDepth: {
            value: new THREE.Color(0.0, 0.09, 0.18) // default SEA_BASE
        },
        uCameraHeight: {
            value: 20.0 // default camera height offset
        }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
    fragmentShader: `
        uniform float iTime;
        uniform vec2 iResolution;
        uniform float uCameraHeight;
        uniform sampler2D iChannel0;
        uniform float uCloudHeight;
        uniform float uCloudBottomHeight;
        uniform int uRenderClouds;
        uniform int uRenderGodrays;
        varying vec2 vUv;
        
        const float PI = 3.141592;
        const float EPSILON = 1e-3;
        const int NUM_STEPS = 8;
        #define EPSILON_NRM (0.1 / iResolution.x)
        
        // lighting
        float diffuse(vec3 n,vec3 l,float p) {
            return pow(dot(n,l) * 0.4 + 0.6,p);
        }
        float specular(vec3 n,vec3 l,vec3 e,float s) {    
            float nrm = (s + 8.0) / (PI * 8.0);
            return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
        }
        uniform vec3 uFogColor;
        uniform vec3 uSkyBottom;
        uniform vec3 uSkyTop;
        uniform vec3 uLightDirection;
        uniform float uFresnelStrength;
        uniform float uSunHeight;
        
        mat3 m = mat3(0.00, 1.60, 1.20, -1.60, 0.72, -0.96, -1.20, -0.96, 1.28);
        
        // Noise functions
        float noiseTexture(vec2 p) {
            return texture2D(iChannel0, p * vec2(1.0/256.0), 0.0).x;
        }
        
        float hash(float n) {
            return fract(cos(n) * 41415.92653);
        }
        
        float hash(vec2 p) {
            float h = dot(p, vec2(127.1, 311.7));
            return fract(sin(h) * 43758.5453123);
        }
        
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return -1.0 + 2.0 * mix(
                mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                u.y
            );
        }
        
        float noise(vec3 x) {
            vec3 p = floor(x);
            vec3 f = smoothstep(0.0, 1.0, fract(x));
            float n = p.x + p.y * 57.0 + 113.0 * p.z;
            return mix(
                mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                    mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                    mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
        }
        
        float fbm(vec3 p) {
            float f = 0.5000 * noise(p); p = m * p * 1.1;
            f += 0.2500 * noise(p); p = m * p * 1.2;
            f += 0.1666 * noise(p); p = m * p;
            f += 0.0834 * noise(p);
            return f;
        }
        
        vec3 getSkyColor(vec3 rd) {
            vec3 currentLightDir = normalize(vec3(uLightDirection.x, uSunHeight, uLightDirection.z));
            float sundot = clamp(dot(rd, currentLightDir), 0.0, 1.0);
            
            float t = pow(1.0 - uFresnelStrength * rd.y, 15.0);
            vec3 col = 0.8 * (uSkyBottom * t + uSkyTop * (1.0 - t));
            col += 0.47 * vec3(1.6, 1.4, 1.0) * pow(sundot, 350.0);
            col += 0.4 * vec3(0.8, 0.9, 1.0) * pow(sundot, 2.0);
            
            if(uRenderClouds == 1 && rd.y > 0.0) {
                vec3 campos = vec3(0.0, uCloudHeight, 0.0);
                vec2 shift = vec2(iTime * 80.0, iTime * 60.0);
                vec4 sum = vec4(0.0);
                
                for(int q = 0; q < 100; q++) {
                    float c = (float(q) * 12.0 + uCloudHeight - campos.y) / rd.y;
                    vec3 cpos = campos + c * rd + vec3(831.0, 321.0 + float(q) * 0.15 - shift.x * 0.2, 1330.0 + shift.y * 3.0);
                    float alpha = smoothstep(0.5, 1.0, fbm(cpos * 0.0015)) * 0.9 * 
                        smoothstep(uCloudBottomHeight, uCloudBottomHeight + 50.0, cpos.y);
                    vec3 localcolor = mix(vec3(1.1, 1.05, 1.0), 0.7 * vec3(0.4, 0.4, 0.3), alpha);
                    alpha = (1.0 - sum.w) * alpha;
                    sum += vec4(localcolor * alpha, alpha);
                    
                    if(sum.w > 0.98) break;
                }
                
                float alpha = smoothstep(0.7, 1.0, sum.w);
                sum.rgb /= sum.w + 0.0001;
                
                sum.rgb -= 0.6 * vec3(0.8, 0.75, 0.7) * pow(sundot, 13.0) * alpha;
                sum.rgb += 0.2 * vec3(1.3, 1.2, 1.0) * pow(sundot, 5.0) * (1.0 - alpha);
                
                col = mix(col, sum.rgb, sum.w * (1.0 - t));
            }
            
            return col;
        }
        mat3 fromEuler(vec3 ang) {
            vec2 a1 = vec2(sin(ang.x),cos(ang.x));
            vec2 a2 = vec2(sin(ang.y),cos(ang.y));
            vec2 a3 = vec2(sin(ang.z),cos(ang.z));
            mat3 m;
            m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
            m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
            m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
            return m;
        }
        
        // sea
        const int ITER_GEOMETRY = 3;
        const int ITER_FRAGMENT = 5;
        uniform float uWaveHeight;    // replaces SEA_HEIGHT
        uniform float uWaveChoppy;    // replaces SEA_CHOPPY
        uniform float uWaveSpeed;     // replaces SEA_SPEED
        const float SEA_FREQ = 0.16;
        uniform vec3 uWaterDepth;     // replaces SEA_BASE
        uniform vec3 uWaterColor;     // replaces SEA_WATER_COLOR
        #define SEA_TIME (1.0 + iTime * uWaveSpeed)
        const mat2 octave_m = mat2(1.6, 1.2, -1.2, 1.6);


        float sea_octave(vec2 uv, float choppy) {
            uv += noise(uv);
            vec2 wv = 1.0 - abs(sin(uv));
            vec2 swv = abs(cos(uv));
            wv = mix(wv, swv, wv);
            return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
        }

        float map(vec3 p) {
            float freq = SEA_FREQ;
            float amp = uWaveHeight;
            float choppy = uWaveChoppy;
            vec2 uv = p.xz;
            uv.x *= 0.75;
            float d, h = 0.0;
            for(int i = 0; i < ITER_GEOMETRY; i++) {
                d = sea_octave((uv + SEA_TIME) * freq, choppy);
                d += sea_octave((uv - SEA_TIME) * freq, choppy);
                h += d * amp;
                uv *= octave_m;
                freq *= 1.9;
                amp *= 0.22;
                choppy = mix(choppy, 1.0, 0.2);
            }
            return p.y - h;
        }
        float map_detailed(vec3 p) {
            float freq = SEA_FREQ;
            float amp = uWaveHeight;
            float choppy = uWaveChoppy;
            vec2 uv = p.xz; uv.x *= 0.75;
            
            float d, h = 0.0;    
            for(int i = 0; i < ITER_FRAGMENT; i++) {        
                d = sea_octave((uv+SEA_TIME)*freq,choppy);
                d += sea_octave((uv-SEA_TIME)*freq,choppy);
                h += d * amp;        
                uv *= octave_m; freq *= 1.9; amp *= 0.22;
                choppy = mix(choppy,1.0,0.2);
            }
            return p.y - h;
        }
        vec3 getNormal(vec3 p, float eps) {
            vec3 n;
            n.y = map_detailed(p);    
            n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
            n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
            n.y = eps;
            return normalize(n);
        }
        float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {  
            float tm = 0.0;
            float tx = 1000.0;    
            float hx = map(ori + dir * tx);
            if(hx > 0.0) {
                p = ori + dir * tx;
                return tx;   
            }
            float hm = map(ori);    
            for(int i = 0; i < NUM_STEPS; i++) {
                float tmid = mix(tm,tx,hm/(hm-hx));
                p = ori + dir * tmid;
                float hmid = map(p);
                if(hmid < 0.0) {
                    tx = tmid;
                    hx = hmid;
                } else {
                    tm = tmid;
                    hm = hmid;
                }
                if(abs(hmid) < EPSILON) break;
            }
            return mix(tm,tx,hm/(hm-hx));
        }
        vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {  
            float fresnel = clamp(1.0 - dot(n,-eye),0.0,1.0);
            fresnel = pow(fresnel,3.0) * 0.5;
            vec3 reflected = getSkyColor(reflect(eye,n));    
            vec3 refracted = uWaterDepth + diffuse(n,l,80.0) * (uWaterColor * 0.6) * 0.12; 
            vec3 color = mix(refracted,reflected,fresnel);
            float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
            color += (uWaterColor * 0.6) * (p.y - uWaveHeight) * 0.18 * atten;
            color += specular(n,l,eye,60.0);
            return color;
        }
        // Cloud tracing
        float trace_fog(vec3 rStart, vec3 rDirection) {
            if(uRenderClouds == 0) return 1.0;
            
            vec2 shift = vec2(iTime * 80.0, iTime * 60.0);
            float sum = 0.0;
            float q2 = 0.0, q3 = 0.0;
            
            for(int q = 0; q < 10; q++) {
                float c = (q2 + uCloudHeight - rStart.y) / rDirection.y;
                vec3 cpos = rStart + c * rDirection + vec3(831.0, 321.0 + q3 - shift.x * 0.2, 1330.0 + shift.y * 3.0);
                float alpha = smoothstep(0.5, 1.0, fbm(cpos * 0.0015));
                sum += (1.0 - sum) * alpha;
                if(sum > 0.98) break;
                q2 += 120.0;
                q3 += 0.15;
            }
            
            return clamp(1.0 - sum, 0.0, 1.0);
        }
        
        // Main tracing function
        bool trace(vec3 rStart, vec3 rDirection, float sundot, out float fog, out float dist) {
            float t = 0.0;
            float st = 1.0;
            float alpha = 0.1;
            float asum = 0.0;
            vec3 p = rStart;
            
            for(int j = 0; j < 120; j++) {
                if(t > 500.0) st = 2.0;
                else if(t > 800.0) st = 5.0;
                else if(t > 1000.0) st = 12.0;
                
                p = rStart + t * rDirection;
                
                if(uRenderGodrays == 1 && rDirection.y > 0.0 && sundot > 0.001 && t > 400.0 && t < 2500.0) {
                    vec3 currentLightDir = normalize(vec3(uLightDirection.x, uSunHeight, uLightDirection.z));
                    alpha = sundot * st * 0.024 * smoothstep(0.80, 1.0, trace_fog(p, currentLightDir));
                    asum += (1.0 - asum) * alpha;
                    if(asum > 0.9) break;
                }
                
                if(p.y > uCloudHeight + 100.0) break;
                
                if(rDirection.y > 0.0) t += 30.0 * st;
                else t += st;
            }
            
            dist = t;
            fog = asum;
            return false;
        }
        
        void main() {
            vec2 uv = gl_FragCoord.xy / iResolution.xy;
            uv = uv * 2.0 - 1.0;
            uv.x *= iResolution.x / iResolution.y;
            float time = iTime * 0.3;
            
            // ray from camera
            vec3 ori = cameraPosition + vec3(0.0, uCameraHeight, 0.0);
            vec3 rd = normalize(vec3(uv.x, uv.y, -2.0));
            vec3 dir = (vec4(rd, 0.0) * viewMatrix).xyz;
            
            // tracing
            vec3 p;
            heightMapTracing(ori,dir,p);
            vec3 dist = p - ori;
            vec3 n = getNormal(p, dot(dist,dist) * EPSILON_NRM);
            vec3 light = normalize(vec3(uLightDirection.x, uSunHeight, uLightDirection.z));
            
            // Calculate fog and god rays
            float fog = 0.0, godray_dist = 0.0;
            trace(ori, dir, dot(dir, light), fog, godray_dist);
            
            // color
            vec3 color = mix(
                getSkyColor(dir),
                getSeaColor(p,n,light,dir,dist),
                pow(smoothstep(0.0,-0.02,dir.y),0.2));
            
            // Add god rays if enabled
            if(uRenderGodrays == 1) {
                color += vec3(0.5, 0.4, 0.3) * fog;
            }
            
            // final color
            gl_FragColor = vec4(pow(color,vec3(0.65)), 1.0);
        }`
};