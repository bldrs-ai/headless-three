import fs from 'fs'
import {rest} from 'msw'
import {setupServer} from 'msw/node'
import path from 'path'
import {MSW_TEST_PORT} from '../setupTests'


export const handlers = [
  rest.get(`http://localhost:${MSW_TEST_PORT}/models/:type/:modelFileName`, (req, res, ctx) => {
    const {type, modelFileName} = req.params

    // Define the path to your repo's 'models' directory
    const modelsDirectory = path.join(__dirname, '../../', 'models', type)

    try {
      // Read the content of the requested file
      const modelFilePath = path.join(modelsDirectory, modelFileName)
      const fileContent = fs.readFileSync(modelFilePath, 'utf-8')

      // Serve the file content as a response
      return res(
        ctx.status(200),
        ctx.text(fileContent)
      );
    } catch {
      // If the file is not found or there's an error, return a 404 response
      return res(
        ctx.status(404),
        ctx.text('File not found')
      );
    }
  }),

  rest.get(`http://localhost:${MSW_TEST_PORT}/file-that-does-not-exist.txt`, (req, res, ctx) => {
    return res(
        ctx.status(404),
    )
  })
]


export const server = setupServer(...handlers)
