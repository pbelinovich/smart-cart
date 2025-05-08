type Path = Array<string | number>

const s4 = () =>
  Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1)

export const guid = () => s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()

export const snapshot = <T>(obj: T, allowFunction = false): T => {
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }
  if (obj instanceof Array) {
    return obj.map((n: any) => snapshot<any>(n)) as any
  }
  if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj) as (keyof T)[]
    const n = {} as T
    keys.forEach(k => {
      n[k] = snapshot<any>(obj[k], allowFunction)
    })
    return n
  }
  if (typeof obj === 'function' && !allowFunction) {
    throw new Error(
      'Unable to make snapshot! Source argument is function or contains function! In order to avoid this error please pass true as second argument. Example: snapshot(target, true)'
    )
  }
  return obj
}

export const NAME_SEPARATOR = '.'
export const ARRAY_START_INDICATOR = '['
export const ARRAY_END_INDICATOR = ']'
export const NOT_FOUND = Symbol('NOT_FOUND')

export function getStateByPath(
  path: Path | string,
  state: {
    [key: string]: any
  },
  allowUndefinedIfNotProperty: boolean = false
): any {
  const pathParsed = Array.isArray(path) ? path : path === '' ? [] : splitName(path.startsWith('.') ? path.substr(1) : path)

  if (pathParsed.length === 0) {
    return state
  }

  if (!state || (!allowUndefinedIfNotProperty && !state.hasOwnProperty(pathParsed[0]))) {
    return NOT_FOUND
  }
  return getStateByPath(pathParsed.slice(1), state[pathParsed[0]], allowUndefinedIfNotProperty)
}

const defaultState = {}
const defaultArr: any[] = []

export function putByPath(value: any, path: Path, stateIn: { [key: string]: any }): object {
  if (path.length === 0) {
    return value
  }
  const curName = path[0]
  const isArr = typeof curName === 'number'
  const state = isArr ? stateIn || defaultArr : stateIn || defaultState
  if (!isArr) {
    if (path.length > 1) {
      return { ...state, [curName]: putByPath(value, path.slice(1), state[curName]) }
    }
    return { ...state, [curName]: value }
  } else {
    const arr = [...(state as any[])]
    arr[curName as any] = path.length > 1 ? putByPath(value, path.slice(1), state[curName]) : value
    return arr
  }
}

export function deleteByPath(path: Path, state: { [key: string]: any }): object {
  const curName = path[0]
  const isArr = typeof curName === 'number'
  if (!isArr) {
    if (path.length > 1) {
      const deleted = deleteByPath(path.slice(1), state[curName])
      if (Object.keys(deleted).length || Array.isArray(deleted)) {
        return { ...state, [curName]: deleted }
      }
    }
    const result = { ...state }
    delete result[curName]
    return result
  }

  if (path.length > 1) {
    const deleted = deleteByPath(path.slice(1), state[curName])
    if (Object.keys(deleted).length || Array.isArray(deleted)) {
      return (state as any[]).map((el, i) => (i === curName ? deleted : el))
    }
  }
  return (state as any[]).filter((_, i) => i !== curName)
}

const cache: { [key: string]: any } = {}
export const splitName = (name: string): Path => {
  if (cache[name]) {
    return cache[name]
  }
  const byArr = name.split(ARRAY_START_INDICATOR)
  if (byArr.length === 1) {
    return name.split(NAME_SEPARATOR)
  }
  const result: Path = []
  byArr.forEach((item, index) => {
    const peaces = item.split(ARRAY_END_INDICATOR)
    if (index === 0) {
      if (peaces.length !== 1) {
        throw new Error(`Unable to parse path ${name}`)
      }
      result.push(...peaces[0].split(NAME_SEPARATOR))
    } else {
      if (peaces.length !== 2) {
        throw new Error(`Unable to parse path ${name}`)
      }
      result.push(Number(peaces[0]))
      if (peaces[1]) {
        result.push(...peaces[1].split(NAME_SEPARATOR).filter(s => s))
      }
    }
  })
  cache[name] = result
  return result
}
export const values = (obj: { [key: string]: any }) => Object.keys(obj).map(key => obj[key])
