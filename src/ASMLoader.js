import * as THREE from 'three'

// https://github.com/AutodeskAILab/Fusion360GalleryDataset/blob/master/docs/assembly.md#assembly-json
/*
  {
    "tree": {...},
    "root": {...},
    "occurrences": {...},
    "components": {...},
    "bodies": {...},
    "joints": {...},
    "as_built_joints": {...},
    "contacts": [...],
    "holes": [...],
    "properties": {...}
  }
*/
export default class ASMLoader {
  constructor() {
  }
  parse(data, basePath, onLoad, onError) {
    const model = JSON.parse(data)
    const axesHelper = new THREE.AxesHelper(5)
    return axeshelper
  }
}
