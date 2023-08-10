import {load} from './Loader'
import './fetch-polyfill'


describe('Loader', () => {
  it('Loads an IFC model', async () => {
    const onProgress = jest.fn()
    const onUnknownType =  jest.fn()
    const onError =  jest.fn()
    const model = await load(
      'models/index.ifc',
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
  })


  it('Loads an OBJ model', async () => {
    const onProgress = jest.fn()
    const onUnknownType =  jest.fn()
    const onError =  jest.fn()
    const model = await load(
      'models/Bunny.obj',
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
  })
})
