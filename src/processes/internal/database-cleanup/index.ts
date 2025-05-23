import { schedule, ScheduledTask } from 'node-cron'
import { buildProcessHandler } from '../../common'
import {
  IDatabaseCleanupParams,
  removeOldProductsRequests,
  removeOldPresentProducts,
  removeOldAbsentProducts,
  removeOldProductsResponses,
  removeOldChangeCityRequests,
} from '../../external'

let task: ScheduledTask | null = null

export const databaseCleanup = buildProcessHandler(({ writeExecutor, log }, params: IDatabaseCleanupParams) => {
  if (task) {
    task.stop()
  }

  task = schedule(params.cronExpression, async () => {
    try {
      const result = await writeExecutor.execute(removeOldProductsRequests, { limit: 2000 })
      log(`Cleaned up ${result.cleanedCount} old products requests`)
    } catch (error) {
      log(`Something went wrong during cleanup products requests: ${error}`)
    }

    try {
      const result = await writeExecutor.execute(removeOldProductsResponses, { limit: 2000 })
      log(`Cleaned up ${result.cleanedCount} old products responses`)
    } catch (error) {
      log(`Something went wrong during cleanup products responses: ${error}`)
    }

    try {
      const result = await writeExecutor.execute(removeOldChangeCityRequests, { limit: 2000 })
      log(`Cleaned up ${result.cleanedCount} old change city requests`)
    } catch (error) {
      log(`Something went wrong during cleanup change city requests: ${error}`)
    }

    try {
      const result = await writeExecutor.execute(removeOldPresentProducts, { limit: 2000 })
      log(`Cleaned up ${result.cleanedCount} old present products`)
    } catch (error) {
      log(`Something went wrong during cleanup present products: ${error}`)
    }

    try {
      const result = await writeExecutor.execute(removeOldAbsentProducts, { limit: 2000 })
      log(`Cleaned up ${result.cleanedCount} old absent products`)
    } catch (error) {
      log(`Something went wrong during cleanup absent products: ${error}`)
    }
  })

  return Promise.resolve()
})
