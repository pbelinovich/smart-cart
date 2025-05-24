export interface IQueueMaster {
  enqueue: (callback: () => Promise<void>) => Promise<void>
}

export class QueueMaster implements IQueueMaster {
  private queue: (() => Promise<void>)[] = []
  private processing = false

  private processQueue = async () => {
    if (this.processing) return

    this.processing = true

    while (this.queue.length > 0) {
      try {
        await this.queue.shift()!()
      } catch (e) {
        if (this.onException) {
          this.onException(e)
        }
        throw e
      }
    }

    this.processing = false
  }

  constructor(private onException?: (e: any) => void) {}

  enqueue = (callback: () => Promise<void>) => {
    let resolve: () => void = () => undefined
    let reject: (err: any) => void = () => undefined
    const promise = new Promise<void>((res, rej) => {
      resolve = res
      reject = rej
    })
    this.queue.push(() => {
      return callback()
        .then(() => {
          resolve()
        })
        .catch(e => {
          reject(e)
          throw e
        })
    })

    Promise.resolve().then(this.processQueue)

    return promise
  }
}
