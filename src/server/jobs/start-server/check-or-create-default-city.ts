import { buildSimpleJob } from '../common'
import { createDefaultCity } from '../../external'

export const checkOrCreateDefaultCity = buildSimpleJob(async ({ writeExecutor }) => {
  await writeExecutor.execute(createDefaultCity, {})
})
