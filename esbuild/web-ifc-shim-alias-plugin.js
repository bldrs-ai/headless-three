import path from 'node:path'


function webIfcShimAliasPlugin(isConway = true) {
  return {
    name: 'web-ifc-shim-alias',
    setup(build) {
      build.onResolve({ filter: /^web-ifc$/ }, (/* args */) => {
        return {
          path: isConway ?
            // The standalone @bldrs-ai/conway-web-ifc-adapter package is
            // retired; conway now ships the web-ifc compat shim in-tree.
            path.resolve('node_modules/@bldrs-ai/conway/compiled/src/compat/web-ifc/ifc_api.js') :
            path.resolve('../external/web-ifc-api.js'),
        }
      });
    },
  }
}


export {webIfcShimAliasPlugin}
