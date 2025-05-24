export interface Observer<T> {
  getValue: () => T
  trigger: (val: T) => void
  subscribe: (sub: (val: T) => void) => () => void
  subscribeToValue: <TVal extends string | number | boolean>(val: TVal, sub: (val: TVal) => void) => () => void
}

export const createObserver = function <T>(initialVal: T): Observer<T> {
  let subs: ((val: T) => void)[] = []
  const subsByVal: { [key: string]: Array<(val: any) => void> } = {}
  let lastVal = initialVal
  return {
    getValue: () => lastVal,
    trigger: (val: T) => {
      if (val === lastVal) {
        return
      }
      lastVal = val
      subs.forEach(x => x(val))
      const key = `${typeof val}_${val}`
      if (subsByVal[key]) {
        subsByVal[key].forEach(x => x(val))
      }
    },
    subscribe: (sub: (val: T) => void) => {
      subs.push(sub)
      return () => {
        subs = subs.filter(x => x !== sub)
      }
    },
    subscribeToValue: <TVal extends string | number | boolean>(val: TVal, sub: (val: TVal) => void) => {
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
