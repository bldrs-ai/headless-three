import {server} from './mocks/msw.js'


// TODO(pablo): export and reuse when bun bug is fixed
// https://github.com/oven-sh/bun/issues/6335
const MSW_TEST_PORT = 3000
beforeAll(() => server.listen({onUnhandledRequest: 'error'}, {MSW_TEST_PORT}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
