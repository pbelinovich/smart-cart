import { IAppExecutors } from '../external'
import { Job } from '../types'

export const buildIntervalJob = (job: Job, interval: number) => (executors: IAppExecutors) => {
  const intervalId = setInterval(() => job(executors), interval)
  return () => clearInterval(intervalId)
}

export const buildSimpleJob = (job: Job, timeout?: number) => (executors: IAppExecutors) => {
  if (timeout === undefined) {
    return job(executors)
  }

  return new Promise<any>(resolve => {
    setTimeout(() => job(executors).then(resolve), timeout)
  })
}
