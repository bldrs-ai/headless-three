import { getMockRes } from '@jest-mock/express';
import renderHandler from './render.js';

describe('/render', () => {
  it('should return a 400 if no body is provided', async () => {
    const req = {}
    const { res } = getMockRes()

    await renderHandler(req, res)
    expect(res.status).toHaveBeenLastCalledWith(400)
  })

  it('should return a 400 if no URL is present in body', async () => {
    const req = {
      body: {}
    }
    const { res } = getMockRes()

    await renderHandler(req, res)
    expect(res.status).toHaveBeenLastCalledWith(400)
  })

  it('should return a 400 if an empty URL is provided', async () => {
    const req = {
      body: {
        url: ''
      }
    }
    const { res } = getMockRes()

    await renderHandler(req, res)
    expect(res.status).toHaveBeenLastCalledWith(400)
  })

  it('should return a 400 if an invalid URL is provided', async () => {
    const req = {
      body: {
        url: 'something'
      }
    }
    const { res } = getMockRes()

    await renderHandler(req, res)
    expect(res.status).toHaveBeenLastCalledWith(400)
  })

  it('should return a 500 if the URL cannot be loaded', async () => {
    const req = {
      body: {
        url: 'http://localhost:3000/file-that-does-not-exist.txt'
      }
    }
    const { res } = getMockRes()

    await renderHandler(req, res)
    expect(res.status).toHaveBeenLastCalledWith(500)
  })
})
