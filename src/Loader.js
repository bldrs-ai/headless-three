import axios from 'axios'
import fs from 'fs'
import {IFCLoader} from 'web-ifc-three'
// TODO(pablo): This was being used for original h3.
//import {IFCLoader} from 'web-ifc-three/web-ifc-three/dist/web-ifc-three.js'
// TODO(pablo): This would be nice, but as built, it has a dynamic require of 'fs' that breaks.
//import {IFCLoader} from 'three/addons/loaders/IFCLoader.js'
import {Rhino3dmLoader} from 'three/addons/loaders/3DMLoader.js'
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js'
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js'
import {PDBLoader} from 'three/addons/loaders/PDBLoader.js'
import {STLLoader} from 'three/addons/loaders/STLLoader.js'
import {XYZLoader} from 'three/addons/loaders/XYZLoader.js'
import BLDLoader from './BLDLoader.js'
import * as Filetype from './Filetype.js'
import {assertDefined, assertTrue} from './assert.js'
import debug from './debug.js'
import {maybeResolveLocalPath} from './urls.js'
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
  url = maybeResolveLocalPath(url) || url
  assertDefined(url, onProgress, onUnknownType, onError)
  assertTrue(url instanceof URL)

  const [loader, isLoaderAsync, isFormatText, fixupCb] = await findLoader(url.pathname)
  debug().log(
    `Loader#load, pathname=${url.pathname} loader=${loader.constructor.name} isLoaderAsync=${isLoaderAsync} isFormatText=${isFormatText}`)

  if (loader === undefined) {
    onUnknownType()
    return undefined
  }

  let modelData = (await axios.get(
    url.toString(),
    { responseType:
      isFormatText
      ? 'text'
      : 'arraybuffer' }
  )).data

  // In headless mode, this is a Node Buffer.  Convert to js
  // ArrayBuffer for local/network agnostic handling.
  if (modelData instanceof Buffer) {
    modelData = modelData.buffer.slice(modelData.byteOffset, modelData.byteOffset + modelData.length)
  }

  // Provide basePath for multi-file models.  Keep the last '/' for
  // correct resolution of subpaths with '../'.
  const basePath = url.href.substring(0, url.href.lastIndexOf('/') + 1)
  let model = await readModel(loader, modelData, basePath, isLoaderAsync)

  if (fixupCb) {
    model = fixupCb(model)
  }

  return model
}


async function readModel(loader, modelData, basePath, isLoaderAsync) {
  // debug().log(`Loader#readModel: loader(${loader.constructor.name}) basePath(${basePath}) isAsync(${isLoaderAsync}), data type: `, typeof modelData)
  let model
  // GLTFLoader is unique so far in using an onLoad and onError.
  // TODO(pablo): GLTF also generates errors for texture loads, but
  // that seems to be deep in the promise stack within the loader.
  if (loader instanceof GLTFLoader) {
    model = await new Promise((resolve, reject) => {
      try {
        loader.parse(modelData, './', (m) => {
          resolve(m)
        }, (err) => {
          reject(`Loader error during parse: ${err}`)
        })
      } catch (e) {
        reject(`Unhandled error in parse ${e}`)
      }
    })
  } else if (isLoaderAsync) {
    model = await loader.parse(modelData, basePath)
  } else {
    model = loader.parse(modelData, basePath)
  }
  if (!model) {
    throw new Error('Loader could not read model')
  }
  return model
}


// TODO(pablo): not used.  Would be a higher-level API into the three
// loader system.  Maybe works better for complex loaders. TBD.
async function delegateLoad(url) {
  const urlStr = url.toString()
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
      isFormatText = false
      break
    }
    case '.xyz': {
      loader = new XYZLoader
      fixupCb = xyzToThree
      isFormatText = true
      break
    }
    case '.glb': {
      loader = newGltfLoader()
      fixupCb = glbToThree
      isLoaderAsync = false
      break
    }
    /*
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
  dracoLoader.setDecoderPath('./node_modules/three/examples/jsm/libs/draco/')
  loader.setDRACOLoader(dracoLoader)
  return loader
}


/**
 * Sets up the IFCLoader to use the wasm module and move the model to
 * the origin on load.
 */
async function newIfcLoader() {
  const loader = new IFCLoader()
  // TODO(pablo): Now using Conway, it's working, but not sure how!
  //loader.ifcManager.setWasmPath('../../../web-ifc/')
  //loader.ifcManager.setWasmPath('../../../bldrs-conway/compiled/dependencies/conway-geom/Dist/')

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
