import fs from 'fs'


const webIfcThreeImportFixupPlugin = {
  name: 'web-ifc-three-import-fixup',
  setup(build) {
    build.onLoad({ filter: /web-ifc-three\/IFCLoader.js/ }, async (args) => {
      let contents = await fs.promises.readFile(args.path, 'utf8')

      contents = contents.replace(
        "import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';",
        "import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';",
      )

      return { contents, loader: 'js' }
    });
  },
}


export {webIfcThreeImportFixupPlugin}
