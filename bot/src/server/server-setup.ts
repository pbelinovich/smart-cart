import express from 'express'
import http from 'node:http'
import { logError, logInfo } from './external'
import { SetupAndRunServerParams } from './types'
import { morganMiddleware } from './middlewares'

export const setupAndRunServer = ({ serverParams }: SetupAndRunServerParams) => {
  const serverApp = express()

  serverApp.use(express.json())
  serverApp.use(morganMiddleware)

  // initialize a simple http server
  const server = http.createServer(serverApp)

  // start our server
  const port = serverParams.port

  server
    .listen(port, () => {
      logInfo(`Smart Cart bot started on port ${port}`)
    })
    .once('error', (err: any) => {
      logError(err.code === 'EADDRINUSE' ? `Port ${port} is already used! Please specify another port or release port ${port}!` : err)
    })
}
