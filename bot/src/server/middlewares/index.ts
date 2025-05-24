import morgan, { StreamOptions } from 'morgan'
import { logError, logVerbose } from '../external'

// Настраиваем поток для перенаправления логов из Morgan в Winston с разными уровнями
const stream: StreamOptions = {
  write: message => {
    const statusCodeMatch = message.match(/\s(\d{3})\s/)
    const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1], 10) : 0

    if (statusCode >= 400) {
      // Ошибочные запросы логируем как 'error'
      logError(message.trim())
    } else {
      // Успешные запросы логируем как 'verbose'
      logVerbose(message.trim())
    }
  },
}

// Используем формат 'combined' для логирования подробной информации о запросах
export const morganMiddleware = morgan('combined', { stream })
