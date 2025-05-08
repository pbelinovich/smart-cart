import 'xregexp'
import { initMainThread } from './main-thread'
import { ServerParams } from './types'

export { publicHttpApi } from './api'

const port = process.env.PORT

const params: ServerParams = {
  port: port || '5010',
}

initMainThread(params)
