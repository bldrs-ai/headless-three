import path from 'node:path'


function webIfcShimAliasPlugin(isConway = true) {
  return {
    name: 'web-ifc-shim-alias',
    setup(build) {
      build.onResolve({ filter: /^web-ifc$/ }, (args) => {
        return {
          path: isConway ?
            path.resolve('node_modules/@bldrs-ai/conway-web-ifc-adapter/compiled/src/ifc_api.js') :
            path.resolve('../external/web-ifc-api.js'),
        }
      });
    },
  }
}


export {webIfcShimAliasPlugin}
