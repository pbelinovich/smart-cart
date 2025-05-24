import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import http from 'node:http'
import { setupHTTPApi } from './api'
import { logError, logInfo } from './external'
import { SetupAndRunServerParams } from './types'
import { morganMiddleware } from './middlewares'

export const setupAndRunServer = ({ serverParams, app, eventBus }: SetupAndRunServerParams) => {
  const serverApp = express()

  serverApp.use(compression())
  serverApp.use(cookieParser())
  serverApp.use(express.json())
  serverApp.use(cors())
  serverApp.use(morganMiddleware)
  /* serverApp.use((req, res, next) => {
    const authHeader = req.headers['authorization']
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }) */

  // initialize a simple http server
  const server = http.createServer(serverApp)

  setupHTTPApi({ expressApp: serverApp, app, eventBus })

  // start our server
  const port = serverParams.port

  server
    .listen(port, () => {
      logInfo(`Smart Cart server started on port ${port}`)
    })
    .once('error', (err: any) => {
      logError(err.code === 'EADDRINUSE' ? `Port ${port} is already used! Please specify another port or release port ${port}!` : err)
    })
}
