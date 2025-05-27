/* eslint-disable @typescript-eslint/no-this-alias */

/**
 * Type of any function that return `void`
 */
export type Procedure = (...args: any[]) => void

/**
 * Interface that has posibility to cancel task
 */
export interface IDebouncer extends Procedure {
  /**
   * Function that cancel current task
   */
  cancel: () => void
  /**
   * Calls function immediatly
   */
  flush: () => void
}

/**
 * A wrapper that defer `func` call to `timeout` milliseconds.
 * "Superfluous" calls overwrite previous pending jobs.
 * All arguments and context are transferred.
 *
 * @param func wrapped function
 * @param timeout defers time
 * @returns debouncer of `func`
 *
 * @summary Wraps `func` and return debouncer
 *
 * @example
 * const log = debounce(console.log)
 * log('first')
 * log('second') // prints only 'second'
 * @example
 * const log = debounce(console.log)
 * log('first')
 * log.cancel() // log not called
 * @example
 * const log = debounce(console.log)
 * log('first')
 * log('second')
 * log.flush() // immediatly calls log and prints 'second'
 */
export function debounce<F extends Procedure>(func: F, timeout: number = 0): IDebouncer {
  let context: any
  let timeoutId: any
  let lastArgs: any[]

  const debouncer: IDebouncer = function (this: any, ...args: any[]) {
    context = this
    lastArgs = args

    const doLater: () => void = function () {
      timeoutId = undefined
      func.apply(context, args)
    }

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(doLater, timeout)
  } as IDebouncer

  debouncer.cancel = function () {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }

  debouncer.flush = function () {
    clearTimeout(timeoutId)
    func.apply(context, lastArgs)
  }

  return debouncer
}

/**
 * A wrapper that defer call `fn` no more than once in `wait` milliseconds.
 * "Superfluous" calls overwrite previous pending jobs.
 * All arguments and context are transferred.
 *
 * @param fn wrapped function
 * @param wait defers time
 * @returns debouncer of `func`
 *
 * @summary Wraps `fn` and return throttled func
 *
 * @example
 * const log = throttle(console.log)
 * log('first') // prints 'first'
 * log('second') // console.log not called
 * log('third') // prints only 'second' after timeout
 * @example
 * const log = throttle(console.log)
 * log('first') // prints 'first'
 * log('second')
 * log.cancel() // log not called
 * @example
 * const log = debounce(console.log)
 * log('first') // prints 'first'
 * log('second')
 * log.flush() // immediatly calls log and prints 'second'
 */
export function throttle<F extends Procedure>(fn: F, wait: number = 0) {
  let context: any
  let lastArgs: any[]
  let isCalled = false
  let jobId: any

  const throttled: IDebouncer = function (this: any, ...args: any[]) {
    context = this
    lastArgs = args

    if (!isCalled) {
      jobId = setTimeout(() => {
        isCalled = false

        fn.apply(context, lastArgs)
      }, wait)
    }

    isCalled = true
  } as IDebouncer

  throttled.cancel = function cancel() {
    clearTimeout(jobId)
    jobId = undefined
    isCalled = false
  }

  throttled.flush = function flush() {
    clearTimeout(jobId)
    jobId = undefined
    isCalled = false

    fn.apply(context, lastArgs)
  }

  return throttled
}
