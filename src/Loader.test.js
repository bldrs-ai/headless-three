import {load} from './Loader'
import './fetch-polyfill'
import * as fs from 'fs';
import path from 'path';

// TODO(pablo): export and reuse when bun bug is fixed
// https://github.com/oven-sh/bun/issues/6335
// import {MSW_TEST_PORT} from './setupTests'
const MSW_TEST_PORT = 3000


let mathRandomSpy
describe('Loader', () => {

  // three.js generates random UUIDs for loaded geometry and material
  // and also references them later, so it's not trivial to freeze or
  // delete them.  So, intercept its call to Math.random instead.
  // TODO(pablo): this should probably increment the value or smth to
  // make each UUID unique.
  beforeEach(() => {
    mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
  })
  afterEach(() => {
    mathRandomSpy.mockRestore()
  })

  // TODO(pablo): loop through all test models.
  it('loads an IFC model', async () => {
    const onProgress = jest.fn()
    const onUnknownType =  jest.fn()
    const onError =  jest.fn()
    const model = await load(
      `http://localhost:${MSW_TEST_PORT}/models/ifc/index.ifc`,
      onProgress,
      onUnknownType,
      onError
    )
    expect(onUnknownType).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    // TODO(pablo): not called
    // expect(onProgress).toHaveBeenCalled()
    expect(model).toBeDefined()
    expect(model.isObject3D).toBe(true)
    expect(model).toMatchSnapshot()
  })

  it('loads an OBJ model', async () => {
    const onProgress = jest.fn()
    const onUnknownType =  jest.fn()
    const onError =  jest.fn()
    const model = await load(
      `http://localhost:${MSW_TEST_PORT}/models/obj/Bunny.obj`,
      onProgress,
      onUnknownType,
      onError
    )
    expect(onUnknownType).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    // TODO(pablo): not called
    // expect(onProgress).toHaveBeenCalled()
    expect(model).toBeDefined()
    expect(model.children[0].isObject3D).toBe(true)
    expect(model).toMatchSnapshot()
  })

  // New Test: Loads a model from a file:// URL
  it('loads a model with encoded filename from a file:// URL', async () => {
    const onProgress = jest.fn();
    const onUnknownType = jest.fn();
    const onError = jest.fn();

    // Ensure APP_ENV is not 'prod' to enable file:// loading
    process.env.APP_ENV = 'development';

    // Define the file path and decoded path
    const relativeFilePath = './models/ifc/index%20test.ifc';

    // Resolve the relative path to an absolute path
    const absoluteFilePath = path.resolve(relativeFilePath);
    const fileURL = new URL(`file://${absoluteFilePath}`);

    const model = await load(
      fileURL,
      onProgress,
      onUnknownType,
      onError
    );

    // Assertions
    expect(onUnknownType).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    // expect(onProgress).toHaveBeenCalled(); // Uncomment if progress events are emitted
    expect(model).toBeDefined();
    expect(model.isObject3D).toBe(true);

    // Clean up
    delete process.env.APP_ENV;
    jest.restoreAllMocks();
  });


  // TODO(pablo): Dies with 'Trace: Loader error during parse:
  // RangeError: Offset is outside the bounds of the DataView'
  // But no stack trace.
  // However, Duck.glb does load for live server.
/*
  it('loads an GLB model', async () => {
    const onProgress = jest.fn()
    const onUnknownType =  jest.fn()
    const onError =  jest.fn()
    const model = await load(
      `http://localhost:${MSW_TEST_PORT}/models/gltf/Duck.glb`,
      onProgress,
      onUnknownType,
      onError
    )
    expect(onUnknownType).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    // TODO(pablo): not called
    // expect(onProgress).toHaveBeenCalled()
    expect(model).toBeDefined()
    //expect(model.children[0].isObject3D).toBe(true)
    expect(model).toMatchSnapshot()
  })
*/
})
