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

    uniform float u_time;

    void main() {
      //gl_FragColor = vec4(abs(sin(u_time/2.)), 1., .2, 1.);
      gl_FragColor = vec4(.5, 1., .2, 1.);
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
}

let material =  new THREE.ShaderMaterial({
    wireframe:true,
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