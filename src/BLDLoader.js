import {AxesHelper, Object3D} from 'three'
import {load} from './Loader.js'
import {parseCoords} from './urls.js'


/** Similar to https://github.com/mrdoob/three.js/wiki/JSON-Object-Scene-format-4 */
export default class BLDLoader {
  constructor() {}


  async parse(data, basePath, onLoad, onError) {
    const model = JSON.parse(data)
    const root = new Object3D
    if (model.scale) {
      root.scale.setScalar(model.scale)
    }

    const axes = new AxesHelper()
    root.add(axes)

    for (let objRef of model.objects) {
      let subPath = objRef.href
      if (basePath) {
        subPath = `${basePath}/${subPath}`
      }
      const hrefUrl = new URL(`file:${subPath}`)
      const subModel = await load(hrefUrl)
      root.add(subModel)

      if (objRef.pos) {
        if (objRef.pos.length !== 3) {
          console.warn('invalid position:', objRef.pos)
          continue
        }
        subModel.position.set(objRef.pos[0], objRef.pos[1], objRef.pos[2])
      }

      // Object scale property overrides base
      if (objRef.scale) {
        subModel.scale.setScalar(objRef.scale)
      } else if (model.objScale) {
        subModel.scale.setScalar(model.objScale)
      }
    }
    return root
  }
}
