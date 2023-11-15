import healthcheckHandler from './healthcheck.js';
import { getMockRes } from '@jest-mock/express';

describe('/healthcheck', () => {
  it('should always return a 200 ok', () => {
    const req = {}
    const { res } = getMockRes()

    healthcheckHandler(req, res)

    expect(res.status).toHaveBeenLastCalledWith(200)
  })
})
