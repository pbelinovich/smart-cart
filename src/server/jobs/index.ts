import { Job, JobWithUnsub } from '../types'
import { IApp } from '../external'
import { checkOrCreateDefaultCity } from './start-server'

const INTERVAL_JOBS: JobWithUnsub[] = []
const START_SERVER_JOBS: Job[] = [checkOrCreateDefaultCity]

export const initJobs = (application: IApp) => {
  const executors = application.getExecutors({})
  const intervalJobStops = INTERVAL_JOBS.map(job => job(executors))

  START_SERVER_JOBS.forEach(job => job(executors))

  return () => intervalJobStops.forEach(x => x())
}
