import { snapshot } from './object-utils'

export interface Observer<T> {
  getValue: () => T
  trigger: (val: T) => void
  subscribe: (sub: (val: T, prevVal: T) => void) => () => void
  subscribeToValue: <TVal extends string | number | boolean>(val: TVal, sub: (val: TVal, prevVal: TVal) => void) => () => void
}

export const createObserver = function <T>(initialVal: T): Observer<T> {
  let subs: ((val: T, prevVal: T) => void)[] = []
  const subsByVal: { [key: string]: Array<(val: any, prevVal: any) => void> } = {}
  let prevVal = initialVal
  return {
    getValue: () => prevVal,
    trigger: (val: T) => {
      if (val === prevVal) {
        return
      }
      const prev = snapshot(prevVal)
      prevVal = val
      subs.forEach(x => x(val, prev))
      const key = `${typeof val}_${val}`
      if (subsByVal[key]) {
        subsByVal[key].forEach(x => x(val, prev))
      }
    },
    subscribe: (sub: (val: T, prevVal: T) => void) => {
      subs.push(sub)
      return () => {
        subs = subs.filter(x => x !== sub)
      }
    },
    subscribeToValue: <TVal extends string | number | boolean>(val: TVal, sub: (val: TVal, prevVal: TVal) => void) => {
      const key = `${typeof val}_${val}`
      if (!subsByVal[key]) {
        subsByVal[key] = []
      }
      subsByVal[key].push(sub)
      return () => {
        subsByVal[key] = subsByVal[key].filter(x => x !== sub)
      }
    },
  }
}
