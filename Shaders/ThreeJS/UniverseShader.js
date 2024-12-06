const StarNestShader = {
    uniforms: {
        'tDiffuse': {
            value: null
        },
        'iTime': {
            value: 0
        },
        'iResolution': {
            value: new THREE.Vector2()
        },
        'iterations': {
            value: 17
        },
        'formuparam': {
            value: 0.53
        },
        'volsteps': {
            value: 20
        },
        'stepsize': {
            value: 0.1
        },
        'zoom': {
            value: 0.800
        },
        'tile': {
            value: 0.850
        },
        'speed': {
            value: 0.010
        },
        'brightness': {
            value: 0.0015
        },
        'darkmatter': {
            value: 0.300
        },
        'distfading': {
            value: 0.730
        },
        'saturation': {
            value: 0.850
        }
    },

    vertexShader: `
			varying vec3 vWorldPosition;
			void main() {
				vec4 worldPosition = modelMatrix * vec4(position, 1.0);
				vWorldPosition = worldPosition.xyz;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,

    fragmentShader: `
			uniform float iTime;
			uniform vec2 iResolution;
			uniform sampler2D tDiffuse;
			varying vec3 vWorldPosition;

			uniform int iterations;
			uniform float formuparam;
			uniform int volsteps;
			uniform float stepsize;
			uniform float zoom;
			uniform float tile;
			uniform float speed;
			uniform float brightness;
			uniform float darkmatter;
			uniform float distfading;
			uniform float saturation;

			void mainImage( out vec4 fragColor, in vec2 fragCoord )
			{
				// Calculate ray direction from world position
				vec3 dir = normalize(vWorldPosition);
				// Use iTime uniform for animation
				float time = iTime * speed + 0.25;
				
				// Calculate animated origin point
				vec3 from = vec3(cos(time*0.5)*3.0, sin(time*0.3)*2.0, sin(time*0.4)*3.0);
				
				//volumetric rendering
				float s=0.1,fade=1.;
				vec3 v=vec3(0.);
				for (int r=0; r<volsteps; r++) {
					vec3 p=from+s*dir*.5;
					p = abs(vec3(tile)-mod(p,vec3(tile*2.))); // tiling fold
					float pa,a=pa=0.;
					for (int i=0; i<iterations; i++) { 
						p=abs(p)/dot(p,p)-formuparam; // the magic formula
						a+=abs(length(p)-pa); // absolute sum of average change
						pa=length(p);
					}
					float dm=max(0.,darkmatter-a*a*.001); //dark matter
					a*=a*a; // add contrast
					if (r>6) fade*=1.-dm; // dark matter, don't render near
					//v+=vec3(dm,dm*.5,0.);
					v+=fade;
					v+=vec3(s,s*s,s*s*s*s)*a*brightness*fade; // coloring based on distance
					fade*=distfading; // distance fading
					s+=stepsize;
				}
				v=mix(vec3(length(v)),v,saturation); //color adjust
				fragColor = vec4(v*.01,1.);	
			}

			void main() {
				vec4 fragColor;
				mainImage(fragColor, gl_FragCoord.xy);
				gl_FragColor = fragColor;
			}
		`
};