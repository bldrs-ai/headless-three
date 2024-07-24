import {
  captureScreenshot, fitModelToFrame, initThree, parseCamera, render
} from '../lib.js'
import { parseUrl } from '../urls.js'
import { load } from '../Loader.js'
import { createTaggedLogger } from '../logging.js'


const renderLogger = createTaggedLogger('/render')

const renderHandler = async (req, res) => {
  if (req.body === undefined || !req.body.url) {
    res.status(400).end('No valid model URL was provided')
    return
  }

  let modelUrl
  try {
    modelUrl = new URL(req.body.url)
  } catch {
    res.status(400).end('No valid model URL was provided')
    return
  }

  const parsedUrl = parseUrl(modelUrl)
  renderLogger.log('debug', 'server#post, parsedUrl:', parsedUrl)
  if (parsedUrl.target === undefined) {
    renderLogger.warn(msg)
    res.status(404).send(`Cannot parse URL: ${modelUrl}`).end()
    return
  }
  const [px, py, pz, tx, ty, tz] = parsedUrl.params.c ? parseCamera(parsedUrl.params.c) : [0,0,0,0,0,0]
  const targetUrl = parsedUrl.target.url
  let model
  try {
    model = await load(targetUrl)
  } catch (e) {
    console.trace('Load failed', e)
    const msg = `Internal server error ${e}`
    renderLogger.error(msg)
    res.status(500).send(msg)
    return
  }
  if (model === undefined) {
    const msg = `Could not load model for unknown reason`
    renderLogger.error(msg)
    res.status(500).send(msg)
    return
  }

  // renderLogger.log('server#post, model:', model)
  const [glCtx, renderer, scene, camera] = initThree()
  scene.add(model)

  if (parsedUrl.params.c) {
    const [px, py, pz, tx, ty, tz] = parseCamera(parsedUrl.params.c) || [0,0,0,0,0,0]
    renderLogger.log('debug', `headless#camera setting: camera.pos(${px}, ${py}, ${pz}) target.pos(${tx}, ${ty}, ${tz})`)
    if (isFinite(px) && isFinite(py) && isFinite(pz)) {
      camera.position.set(px, py, pz)
    }
    if (isFinite(tx) && isFinite(ty) && isFinite(tz)) {
      renderLogger.log('debug', `server#post, camera.pos(${px}, ${py}, ${pz}) target.pos(${tx}, ${ty}, ${tz})`)
      camera.lookAt(tx, ty, tz)
    } else {
      renderLogger.log('debug', `server#post, camera.pos(${px}, ${py}, ${pz}) target.pos(0, 0, 0)`)
      camera.lookAt(0, 0, 0)
    }
  } else {
    fitModelToFrame(renderer.domElement, scene, model, camera)
  }

  const useSsaa = false
  render(renderer, scene, camera, useSsaa)
  res.setHeader('content-type', 'image/png')
  captureScreenshot(glCtx).pipe(res)
}

export default renderHandler
