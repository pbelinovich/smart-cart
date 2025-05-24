import { createLogger, format, transports } from 'winston'

const { combine, timestamp, printf, colorize, errors } = format

// Настраиваем формат вывода логов
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `${timestamp} [${level}]: ${message}\n${stack}` // Если есть стек, добавляем его к логированию
    : `${timestamp} [${level}]: ${message}`
})

// Создаём логгер
const logger = createLogger({
  level: 'info', // Можно настроить уровень логирования (info, warn, error и т.д.)
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    errors({ stack: true }), // Логируем стек ошибок
    colorize(), // Добавляем цвет для удобства при выводе в консоль
    logFormat
  ),
  transports: [
    new transports.Console(), // Вывод логов в консоль
    new transports.File({ filename: 'logs/error.log', level: 'error' }), // Логи ошибок в отдельный файл
    new transports.File({ filename: 'logs/combined.log' }), // Все логи в общий файл
  ],
})

const compose = (args: any[]) => args.map(x => (typeof x === 'object' ? JSON.stringify(x) : x)).join(' ')

export const logWarning = (...args: any[]) => logger.warning(compose(args))
export const logError = (...args: any[]) => {
  return args.forEach(x => logger.error(x))
}
export const logInfo = (...args: any[]) => logger.info(compose(args))

export const logVerbose = (...args: any[]) => logger.verbose(compose(args))
