import 'xregexp'
import 'dotenv/config'
import { initMainThread } from './main-thread'
import { ServerParams } from './types'
import { logInfo, ShutdownManager } from './external'

export { publicHttpApi, IGetChangeCityRequestByIdParams, IGetProductsRequestByIdParams } from './api'
export * from './external'

const port = process.env.PORT

const params: ServerParams = {
  port: port || '5010',
}

initMainThread(params)

process.addListener('SIGINT', async () => {
  logInfo(`Получен сигнал SIGINT. Начинаем завершение работы...`)
  await ShutdownManager.shutdown()
})

process.addListener('SIGTERM', async () => {
  logInfo(`Получен сигнал SIGTERM. Начинаем завершение работы...`)
  await ShutdownManager.shutdown()
})
