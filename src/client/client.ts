import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'


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

scene.add(new THREE.AmbientLight())

new OrbitControls(camera, renderer.domElement)

//const geometry = new THREE.BoxGeometry(1,1,1,10,10,10)
const geometry = new THREE.SphereGeometry(1, 32, 32);

let material =  new THREE.MeshLambertMaterial({
    wireframe:true,
    color: 0xffff00,
  })


const thing = new THREE.Mesh(geometry, material)
scene.add(thing)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function sliceMe() {

    let rendTarg = renderer.getRenderTarget();

        // Create a framebuffer object and set it as the render target
    var fbo = new THREE.WebGLRenderTarget(512, 512, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    renderer.setRenderTarget(fbo);

    // Render the scene to the framebuffer object
    renderer.render(scene, camera);

    // Read the data back into CPU memory
    var pixels = new Uint8Array(512 * 512 * 4);
    renderer.readRenderTargetPixels(fbo, 0, 0, 512, 512, pixels);

    // Generate the 2D slice views
    var sliceData = new Uint8Array(512 * 512 * 4);
    for (var i = 0; i < 512 * 512 * 4; i += 4) {
        sliceData[i + 0] = pixels[i + 0];
        sliceData[i + 1] = pixels[i + 1];
        sliceData[i + 2] = pixels[i + 2];
        sliceData[i + 3] = pixels[i + 3];
    }
    
    var sliceTexture = new THREE.DataTexture(sliceData, 512, 512, THREE.RGBAFormat);
    sliceTexture.needsUpdate = true;


    renderer.setRenderTarget(rendTarg);
}

function sliceToFile(xSize: number, ySize: number, zHeight: number) {
    let rendTarg = renderer.getRenderTarget();
    let camZ = camera.position.z;

    // Create a framebuffer object with specified xSize and ySize and set it as the render target
    var fbo = new THREE.WebGLRenderTarget(xSize, ySize, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    renderer.setRenderTarget(fbo);

    // Render the scene to the framebuffer object with the specified z height
    camera.position.z = zHeight;
    renderer.render(scene, camera);

    // Read the data back into CPU memory
    var pixels = new Uint8Array(xSize * ySize * 4);
    renderer.readRenderTargetPixels(fbo, 0, 0, xSize, ySize, pixels);

    // Create an image using the pixel data
    var img = new ImageData(new Uint8ClampedArray(pixels), xSize, ySize);

    // Convert the image to a png and save it to a file
    var canvas = document.createElement("canvas");
    canvas.width = xSize;
    canvas.height = ySize;
    var ctx = canvas.getContext("2d");

    if (ctx != null) {
        ctx.putImageData(img, 0, 0);
    }

    canvas.toBlob(function(blob) {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        if (blob != null) {
            a.href = URL.createObjectURL(blob);
        }
        a.download = "slice.png";
        a.click();
        URL.revokeObjectURL(a.href);
    }, "image/png");

    renderer.setRenderTarget(rendTarg);
    camera.position.z = camZ;
}


let done=false;
function animate() {
    requestAnimationFrame(animate)


    if (!done) {
        sliceToFile(512, 512, 0);
        done = true;
    }

    render()
}

function render() {
    renderer.render(scene, camera)
}



animate()