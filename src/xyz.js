import {BufferGeometry, Points, PointsMaterial} from 'three'


/**
 * See https://threejs.org/examples/webgl_loader_xyz.html
 * @param {BufferGeometry}
 * @return {Points}
 */
export default function xyzToThree(xyzGeometry) {
  // HACK(pablo): probably shouldn't center.  Camera should do this
  // fine for standalone, and otherwise the offset in multi-model
  // probably matters.
  xyzGeometry.center()
  return new Points(
    xyzGeometry,
    new PointsMaterial({
      size: 0.1,
      color: 0xabcdef
    })
  )
    /*
    new PointsMaterial({
      size: 1,
      vertexColors: xyzGeometry.hasAttribute('color')
    }))*/
}
