import path from 'node:path'


const __dirname = '/Users/pablo/c/b/headless-three/'
const webIfcShimAliasPlugin = {
  name: 'web-ifc-shim-alias',
  setup(build) {
    build.onResolve({ filter: /^web-ifc$/ }, (args) => {
      return {
        path: path.resolve(__dirname, './node_modules/bldrs-conway/compiled/src/shim/ifc_api.js'),
      }
    });
  },
}


export {webIfcShimAliasPlugin}
