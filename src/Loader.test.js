import {load} from './Loader'
import {MSW_TEST_PORT} from './setupTests'
import './fetch-polyfill'


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
})
