import {Points, PointsMaterial} from 'three'


/**
 * See https://threejs.org/examples/webgl_loader_xyz.html
 * @param {BufferGeometry}
 * @return {Points}
 */
export default function xyzToThree(xyzGeometry) {
  return new Points(
    xyzGeometry,
    new PointsMaterial({
      size: 0.1,
      color: 0xabcdef
    })
  )
  // HACK(pablo)
    /*
    new PointsMaterial({
      size: 1,
      vertexColors: xyzGeometry.hasAttribute('color')
    }))*/
}
