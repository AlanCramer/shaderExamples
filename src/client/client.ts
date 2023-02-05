import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

function vertexShader() {
    return `

    uniform float u_time;

    void main() {
      vec4 pos =  vec4(position, 1.0);
      gl_Position =  projectionMatrix * modelViewMatrix *pos;
    }
    `
}

function fragmentShader() {
    return `

    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
  
#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .001
#define TAU 6.283185
#define PI 3.141592
#define S smoothstep
#define T iTime

mat2 Rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s, s, c);
}

float sdBox(vec3 p, vec3 s) {
    p = abs(p)-s;
	return length(max(p, 0.))+min(max(p.x, max(p.y, p.z)), 0.);
}

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdGyroid (vec3 p, float scale, float thickness) {
  p *= scale; // scale the gyroid - drive off a uniform

  float z_mod = p.z / 16.; // normalize z
  thickness = thickness + z_mod; // vary the thickness as a function of z

  return abs(dot(sin(p), cos(p.zxy))) / scale - thickness;
}

float GetDist(vec3 p) {
    float box = sdBox(p, vec3(1));
    float sphere = sdSphere(p, 2.);

    float gyroid = sdGyroid(p, 2., .4);

    float d = max(sphere, gyroid);
    
    return d;
}

float RayMarch(vec3 ro, vec3 rd) {
	float dO=0.;
    
    for(int i=0; i<MAX_STEPS; i++) {
    	vec3 p = ro + rd*dO;
        float dS = GetDist(p);
        dO += dS;
        if(dO>MAX_DIST || abs(dS)<SURF_DIST) break;
    }
    
    return dO;
}

vec3 GetNormal(vec3 p) {
    vec2 e = vec2(.001, 0);
    vec3 n = GetDist(p) - 
        vec3(GetDist(p-e.xyy), GetDist(p-e.yxy),GetDist(p-e.yyx));
    
    return normalize(n);
}

vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 
        f = normalize(l-p),
        r = normalize(cross(vec3(0,1,0), f)),
        u = cross(f,r),
        c = f*z,
        i = c + uv.x*r + uv.y*u;
    return normalize(i);
}

void main( )
{
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
	  vec2 m = u_mouse.xy/u_resolution.xy;

    vec3 ro = vec3(0, 5, -5);
    ro.yz *= Rot(-m.y*PI+1.);
    ro.xz *= Rot(-m.x*TAU);
    
    vec3 rd = GetRayDir(uv, ro, vec3(0,0.,0), 1.);
    vec3 col = vec3(0);
   
    float d = RayMarch(ro, rd);

    if ( d < MAX_DIST ) {
        vec3 p = ro + rd * d;
        vec3 n = GetNormal(p);
        vec3 r = reflect(rd, n);

        // diffusion, TODO how does this work?
        float dif = dot(n, normalize(vec3(1,2,3)))*.5+.5;
        col = vec3(dif);

        // col = vec3(.2, .2, .8);
    }
    
    col = pow(col, vec3(.4545));	// gamma correction
    
    gl_FragColor = vec4(col,1.0);
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

// const geometry = new THREE.BoxGeometry(10,10,10,10,10,10)
const geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight,1,1);
//const geometry = new THREE.SphereGeometry(1, 32, 32);

let uniforms = {
    u_time: { type: 'float', value: 0.0 },
    u_resolution: { type: 'vec2', 
        value: {
            x: renderer.domElement.width, 
            y: renderer.domElement.height
        }
    },
    u_mouse: { type: "v2", value: new THREE.Vector2() }
}

let material =  new THREE.ShaderMaterial({
    wireframe: false,
    uniforms: uniforms,
    fragmentShader: fragmentShader(),
    vertexShader: vertexShader(),
 })


const allPx = new THREE.Mesh(geometry, material)
scene.add(allPx)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)

    if (uniforms.u_resolution !== undefined){
      uniforms.u_resolution.value.x = window.innerWidth;
      uniforms.u_resolution.value.y = window.innerHeight;
    }

    render()
}

window.addEventListener('mousemove', onMouseMove, false)
function onMouseMove(e: { clientX: number; clientY: number }) {
  uniforms.u_mouse.value.x = e.clientX;
  uniforms.u_mouse.value.y = e.clientY;
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