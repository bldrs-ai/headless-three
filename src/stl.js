import {BufferGeometry, Mesh, MeshLambertMaterial} from 'three'


/**
 * @param {BufferGeometry}
 * @return {Mesh}
 */
export default function stlToThree(stlGeometry) {
  // HACK(pablo): probably shouldn't center.  Camera should do this
  // fine for standalone, and otherwise the offset in multi-model
  // probably matters.
  stlGeometry.center()
  return new Mesh(
    stlGeometry,
    new MeshLambertMaterial({
      color: 0xabcdef
    })
  )
}
