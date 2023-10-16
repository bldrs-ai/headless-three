import {server} from './mocks/msw.js'


export const MSW_TEST_PORT = 3000
beforeAll(() => server.listen({onUnhandledRequest: 'error'}, {MSW_TEST_PORT}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
