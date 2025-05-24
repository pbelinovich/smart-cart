import { logError, logInfo } from './logger'

export class ShutdownManager {
  private static tasks: (() => Promise<void> | void)[] = []
  private static isShuttingDown = false

  /**
   * Регистрация новой задачи для завершения.
   * @param task Асинхронная функция, выполняющая операцию завершения.
   */
  static addTask(task: () => Promise<void> | void) {
    this.tasks.push(task)
  }

  /**
   * Инициация процесса завершения.
   */
  static async shutdown() {
    if (this.isShuttingDown) return // Предотвращаем повторное завершение
    this.isShuttingDown = true

    logInfo('Начинаем завершение работы...')
    for (const task of this.tasks) {
      try {
        await task()
      } catch (error) {
        logError(error)
      }
    }

    logInfo('задачи завершены.')
    process.exit(0)
  }
}
