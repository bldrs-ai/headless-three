import axios from 'axios'
import fs from 'fs'
import {Rhino3dmLoader} from 'three/addons/loaders/3DMLoader.js'
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js'
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js'
import {PDBLoader} from 'three/addons/loaders/PDBLoader.js'
import {STLLoader} from 'three/addons/loaders/STLLoader.js'
import {XYZLoader} from 'three/addons/loaders/XYZLoader.js'
import {IFCLoader} from 'web-ifc-three/web-ifc-three/dist/web-ifc-three.js'
import BLDLoader from './BLDLoader.js'
import * as Filetype from './Filetype.js'
import debug from './debug.js'
import './fetch-polyfill.js'
import glbToThree from './glb.js'
import pdbToThree from './pdb.js'
import stlToThree from './stl.js'
import xyzToThree from './xyz.js'


/**
 * @param {URL} url
 * @return {Model|undefined}
 */
export async function load(
  url,
  onProgress = (progressEvent) => {debug().log('Loaders#load: progress: ', progressEvent)},
  onUnknownType = (errEvent) => {debug().error(errEvent)},
  onError = (errEvent) => {debug().error('Loaders#load: error: ', errEvent)}
) {
  debug().log('Loader#load: url:', url)

  const isFileOrigin = url.protocol === 'file:'
  const pathname = url.pathname
  const [loader, isLoaderAsync, isFormatText, fixupCb] = await findLoader(pathname)
  debug().log(`Loader#load, pathname(${pathname}), loader:`, loader.constructor)

  if (loader === undefined) {
    onUnknownType()
    return undefined
  }

  const sourceBuffer = await readToBuffer(url, isFileOrigin, isFormatText)

  const basePath = pathname.substring(0, pathname.lastIndexOf('/'))
  let model = await readModel(loader, basePath, sourceBuffer, isLoaderAsync)
  // debug().log('Loader#load: result', model)

  if (fixupCb) {
    // debug().log('Calling fixup: ', fixupCb, model)
    model = fixupCb(model)
  }

  return model
}


export async function readToBuffer(url, isFileOrigin, isFormatText) {
  let sourceBuffer
  if (isFileOrigin) {
    debug().log('Loader#readToBuffer: loading local file')
    if (isFormatText) {
      debug().log('Loader#readToBuffer: isLocalFile:', false)
      sourceBuffer = fs.readFileSync(decodeURI(url.pathname),  {encoding: 'utf-8'})
    } else {
      debug().log('Loader#readToBuffer: isLocalFile:', true)
      sourceBuffer = fs.readFileSync(decodeURI(url.pathname))
      sourceBuffer = Uint8Array.from(sourceBuffer).buffer
    }
  } else {
    sourceBuffer = await axios.get(
      url.toString(),
      { responseType:
        isFormatText
        ? 'text'
        : 'arraybuffer' }
    )
    sourceBuffer = sourceBuffer.data
  }
  return sourceBuffer
}


async function readModel(loader, basePath, sourceBuffer, isLoaderAsync) {
  debug().log(`Loader#readModel: loader(${loader.constructor.name}) basePath(${basePath}) isAsync(${isLoaderAsync}), data type: `, typeof sourceBuffer)
  let model
  /* GLB
    model = await new Promise((resolve, reject) => {
      debug().log('Loader#readModel: promise in')
      try {
        loader.parse(sourceBuffer, './', (m) => {
          // debug().log('Loader#readModel: promise: model:', m)
          resolve(m)
        }, (err) => {
          debug().log('Loader#readModel: promise: error:', err)
          reject(`Loader error during parse: ${err}`)
        })
      } catch (e) {
        reject(`Unhandled error in parse ${e}`)
      }
      })
      // debug().log('Loader#readModel: promise out, model:', model)
      */
  if (isLoaderAsync) {
    model = await loader.parse(sourceBuffer, basePath)
  } else {
    model = loader.parse(sourceBuffer, basePath)
  }
  if (!model) {
    throw new Error('Loader could not read model')
  }
  // debug().log('Local file load: model:', model)
  return model
}


async function delegateLoad(url) {
  const urlStr = url.toString()
  debug().log('Delegated load:', urlStr)
  return await new Promise((resolve, reject) => {
    loader.load(
      urlStr,
      (model) => {
        debug().log('Loaders#delegateLoad:', model)
        resolve(model)
      },
      (progressEvent) => {
        onProgress()
      },
      (errorEvent) => {
        onError()
        reject(errorEvent)
      },
    )
  })
}


/**
 * @param {string} pathname
 * @return {Loader|undefined}
 */
async function findLoader(pathname) {
  const {parts, extension} = Filetype.splitAroundExtension(pathname)
  let loader
  let isLoaderAsync = false
  let isFormatText = false
  let fixupCb
  switch (extension) {
    case '.bld': {
      loader = new BLDLoader()
      isFormatText = true
      break
    }
    case '.fbx': {
      loader = new FBXLoader()
      break
    }
    case '.ifc': {
      loader = await newIfcLoader()
      isLoaderAsync = true
      break
    }
    case '.obj': {
      loader = new OBJLoader
      isFormatText = true
      break
    }
    case '.pdb': {
      loader = new PDBLoader
      fixupCb = pdbToThree
      isFormatText = true
      break
    }
    case '.stl': {
      loader = new STLLoader
      fixupCb = stlToThree
      // depends isFormatText = true
      break
    }
    case '.xyz': {
      loader = new XYZLoader
      fixupCb = xyzToThree
      isFormatText = true
      break
    }
      /*
    case '.glb': {
      loader = newGltfLoader()
      fixupCb = glbToThree
      isLoaderAsync = false
      break
    }
    case '.3dm': {
      isLoaderAsync = true
      loader = {
        parse: async function(data, path, onLoad, onError) {
          await new Promise((resolve, reject) => {
            const innerLoader = new Rhino3dmLoader()
            innerLoader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@7.15.0/')
            try {
              innerLoader.parse(data, (m) => {
                debug().log('Loader#readModel: promise: model:', m)
                resolve(m)
              }, (err) => {
                debug().log('Loader#readModel: promise: error:', err)
                reject(`Loader error during parse: ${err}`)
              })
            } catch (e) {
              reject(`Unhandled error in parse ${e}`)
            }
          })
        }
      break
    }
    */
    default: throw new Error('Unsupported filetype') // fix
  }
  return [loader, isLoaderAsync, isFormatText, fixupCb]
}


/**
 * @return {GLTFLoader} With DRACO codec enabled
 */
function newGltfLoader() {
  const loader = new GLTFLoader
  const dracoLoader = new DRACOLoader
  dracoLoader.setDecoderPath('http://localhost:8090/node_modules/three/examples/jsm/libs/draco/')
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


function toShortStr(buffer) {
  return buffer.slice(0, 128)
}
