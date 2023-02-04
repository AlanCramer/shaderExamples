import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

function vertexShader() {
    return `

    uniform float u_time;

    void main() {
      vec4 pos =  vec4(position, 1.0);
      if (pos.y > 0.) {
        pos.y = (sin(u_time/2.)+1.)*pos.y;
      }
      gl_Position =  projectionMatrix * modelViewMatrix *pos;
    }
    `
}

function fragmentShader() {
    return `

    uniform vec2 u_resolution;

    const int MAX_MARCHING_STEPS = 255;
    const float MIN_DIST = 0.0;
    const float MAX_DIST = 100.0;
    const float PRECISION = 0.001;
    
    float sdSphere(vec3 p, float r )
    {
      vec3 offset = vec3(0, 0, -2);
      return length(p - offset) - r;
    }
    
    float rayMarch(vec3 ro, vec3 rd, float start, float end) {
      float depth = start;
    
      for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        vec3 p = ro + depth * rd;
        float d = sdSphere(p, 1.);
        depth += d;
        if (d < PRECISION || depth > end) break;
      }
    
      return depth;
    }
    
    vec3 calcNormal(vec3 p) {
        vec2 e = vec2(1.0, -1.0) * 0.0005; // epsilon
        float r = 1.; // radius of sphere
        return normalize(
          e.xyy * sdSphere(p + e.xyy, r) +
          e.yyx * sdSphere(p + e.yyx, r) +
          e.yxy * sdSphere(p + e.yxy, r) +
          e.xxx * sdSphere(p + e.xxx, r));
    }
    
    void main()
    {
      vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    
      vec3 col = vec3(0);
      vec3 ro = vec3(0, 0, 3); // ray origin that represents camera position
      vec3 rd = normalize(vec3(uv, -1)); // ray direction
    
      float d = rayMarch(ro, rd, MIN_DIST, MAX_DIST); // distance to sphere
    
      if (d > MAX_DIST) {
        col = vec3(0.6); // ray didn't hit anything
      } else {
        vec3 p = ro + rd * d; // point on sphere we discovered from ray marching
        vec3 normal = calcNormal(p);
        vec3 lightPosition = vec3(2, 2, 4);
        vec3 lightDirection = normalize(lightPosition - p);
    
        // Calculate diffuse reflection by taking the dot product of 
        // the normal and the light direction.
        float dif = clamp(dot(normal, lightDirection), 0., 1.);
    
        col = vec3(dif);
      }
    
      // Output to screen
      gl_FragColor = vec4(col, 1.0);
    }
    
    `
}


const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.z = 2

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

new OrbitControls(camera, renderer.domElement)

const geometry = new THREE.BoxGeometry(1,1,1,10,10,10)
//const geometry = new THREE.SphereGeometry(1, 32, 32);

let uniforms = {
    u_time: { type: 'float', value: 0.0 },
    u_resolution: { type: 'vec2', 
        value: {
            x: window.innerWidth, 
            y:window.innerHeight
        }
    }
}

let material =  new THREE.ShaderMaterial({
    wireframe: false,
    uniforms: uniforms,
    fragmentShader: fragmentShader(),
    vertexShader: vertexShader(),
 })


const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

let clock = new THREE.Clock()

function animate() {
    requestAnimationFrame(animate)

    let t = clock.getElapsedTime();
    uniforms.u_time.value = t;

    render()
}

function render() {
    renderer.render(scene, camera)
}

animate()