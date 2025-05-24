import 'xregexp'
import 'dotenv/config'
import { initMainThread } from './main-thread'
import { ServerParams } from './types'
import { logInfo, ShutdownManager } from './external'

const port = process.env.PORT
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
const smartCartServerUrl = process.env.SMART_CART_SERVER_URL

const params: ServerParams = {
  port: port || '5011',
  telegramBotToken: telegramBotToken || '',
  smartCartServerUrl: smartCartServerUrl || '127.0.0.1:5010',
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
