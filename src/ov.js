import * as THREE from 'three'
import {
  doRender,
  initDom,
  initGl,
  initRenderer,
  initLights,
  initCamera,
  saveScreenshot,
} from "./lib.js"
import * as OV from '../lib/o3dv.module.js'
import {load} from './Loader.js'


const w = 1024, h = 768
const aspect = w / h
const dom = initDom()
const glCtx = initGl(w, h)


const div = {
  clientWidth: w,
  clientHeight: h,
  appendChild: (elt) => {
    console.log('appendChild:', elt)
    // TODO: For progress.
  }
}


// set the location of the external libraries
OV.SetExternalLibLocation ('../node_modules/online-3d-viewer/libs')


// initialize the viewer with the parent element and some parameters
let viewer = new OV.EmbeddedViewer (div, {
  context: glCtx,
  camera : new OV.Camera (
    new OV.Coord3D (5, 5, 5),
    new OV.Coord3D (0, 0, 0),
    new OV.Coord3D (0, 1, 0),
    45,
  ),
  backgroundColor : new OV.RGBAColor (0, 128, 255, 255),
  defaultColor : new OV.RGBColor (255, 255, 255),
  edgeSettings : new OV.EdgeSettings (true, new OV.RGBColor (0, 0, 255), 1),
  onModelLoaded: () => {
    console.log('LOADED')
  }
})

viewer.viewer.canvas.width = w
viewer.viewer.canvas.height = h
viewer.canvas.style.display = 'block'

// load a model providing model urls
let model
if (true) {
  viewer.LoadModelFromUrlList ([
    'models/Bunny.obj',
    //'../Online3DViewer/test/testfiles/obj/icosahedron.obj',
  ])
} else {
  model = await load('models/Bunny.obj')
  viewer.viewer.scene.add(model)
  viewer.viewer.Render()
}

//console.log(viewer.viewer.scene)

saveScreenshot(glCtx, 'ss1.png')


const renderer = initRenderer(glCtx, w, h)
//const model = await load(process.argv[2])
const ovScene = viewer.viewer.scene
const camera = initCamera(45, aspect)
camera.position.set(5, 5, 5)
camera.lookAt(0, 0, 0)
//ovScene.add(model)
doRender(renderer, ovScene, camera, false)

saveScreenshot(glCtx, 'ss2.png')

/*
      if (this.first) {
        const axes = new THREE.AxesHelper(5)
      for (let i = 0; i < 100; i++) {
      const x = -5 + Math.random() * 10.0;
      const y = -5 + Math.random() * 10.0;
      const z = -5 + Math.random() * 10.0;
      axes.position.set(x, y, z)
      }
      this.scene.add(axes)
        // this.scene.add(new THREE.AmbientLight(0xffffff))
        console.log(this.scene, this.camera)
        this.first = false
      }
*/
