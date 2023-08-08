import fs from 'fs'
import './fetch-polyfill.js'
// import {IFCLoader} from 'web-ifc-three'
// import pkg from 'web-ifc-three'
// const {IFCLoader} = pkg
import {IFCLoader} from 'web-ifc-three/web-ifc-three/dist/web-ifc-three.js'
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js'
import * as Filetype from './Filetype.js'
import debug from './debug.js'


/**
 * @param {string} urlStr
 * @return {Model|undefined}
 */
export async function load(
  urlStr,
  onProgress = (progressEvent) => {console.log(progressEvent)},
  onUnknownType = (errEvent) => {console.error(errEvent)},
  onError = (errEvent) => {console.error(errEvent)}
) {
  const [loader, isAsync, isLocal, isData] = await findLoader(urlStr)
  if (loader === undefined) {
    onUnknownType()
    return undefined
  }
  // alternately, use axios
  // import axios from 'axios'
  //   const response = await axios.get(url, { responseType: 'arraybuffer' })
  if (isLocal) {
    debug().log('Loader#load: isLocal:', true)
    let buf
    if (isData) {
      debug().log('Loader#load: isData:', true)
      buf = fs.readFileSync(new URL(urlStr))
      buf = Uint8Array.from(buf).buffer
    } else {
      debug().log('Loader#load: isData:', false)
      buf = fs.readFileSync(new URL(urlStr),  {encoding: 'utf-8'})
    }
    let model
    if (isAsync) {
      debug().log('Loader#load: isAsync:', true)
      model = await loader.parse(buf)
    } else {
      debug().log('Loader#load: isAsync:', false)
      // TODO(pablo): only works with OBJ
      model = loader.parse(buf)
    }
    debug().log('Local file load: model:', model)
    return model
  } else {
    debug().log('Network load urlStr:', urlStr)
    return await new Promise((resolve, reject) => {
      loader.load(
        urlStr,
        (model) => {
          debug().log('Loaders#load: onLoad: ', model)
          resolve(model)
        },
        (progressEvent) => {
          debug().log('Loaders#load: progress: ', progressEvent)
        },
        (errorEvent) => {
          debug().log('Loaders#load: error: ', errorEvent)
          onError()
          reject(errorEvent)
        },
      )
    })
  }
}


/**
 * @param {string} urlStr
 * @return {Loader|undefined}
 */
async function findLoader(urlStr) {
  const {parts, extension} = Filetype.splitAroundExtension(urlStr)
  let loader
  let isData = true
  let isAsync = false
  switch (extension) {
    case '.glb':
    case '.gltf': {
      loader = newGltfLoader(urlStr)
      break
    }
    case '.ifc': {
      loader = await newIfcLoader()
      isAsync = true
      break
    }
    case '.obj': {
      loader = new OBJLoader
      isData = false
      break
    }
    default: throw new Error('Unknown type') // fix
  }
  const isLocal = urlStr.startsWith('file://')
  return [loader, isAsync, isLocal, isData]
}


/**
 * @return {GLTFLoader}
 */
function newGltfLoader(path) {
  const loader = new GLTFLoader
  // TODO(pablo): extract and use path root.
  // loader.setPath()
  const dracoLoader = new DRACOLoader
  // dracoLoader.setDecoderPath('/static/wasm/draco/')
  // dracoLoader.setDecoderPath('jsm/libs/draco/')
  dracoLoader.setDecoderPath('jsm/libs/draco/')
  loader.setDRACOLoader(dracoLoader)
  return loader
}


/**
 * Sets up the IFCLoader to use the wasm module and move the model to
 * the origin on load.
 */
async function newIfcLoader() {
  const loader = new IFCLoader()
  // TODO(pablo): HAAAACK. This is relative to node_modules/web-ifc-three.
  loader.ifcManager.setWasmPath('../../../web-ifc/')

  // Setting COORDINATE_TO_ORIGIN is necessary to align the model as
  // it is in Share.  USE_FAST_BOOLS is also used live, tho not sure
  // what it does.
  await loader.ifcManager.applyWebIfcConfig({
    COORDINATE_TO_ORIGIN: true,
    USE_FAST_BOOLS: true
  });

  // TODO(pablo): maybe useful to print the coordination matrix from
  // the normalized view for debug?  Will need to be called after
  // model is loaded.
  // const coordMatrix = loader.ifcManager.ifcAPI.GetCoordinationMatrix(0)

  return loader
}
