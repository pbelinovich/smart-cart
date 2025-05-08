import { snapshot } from '../../shared/object-utils'

export const entityToDTO = <T extends { [key: string]: any }>(entity: T): T => {
  const keys = Object.keys(entity) as (keyof T)[]

  return keys.reduce((res, key) => {
    if (typeof key === 'string' && key.startsWith('@')) {
      return res
    }

    res[key] = snapshot(entity[key])
    return res
  }, {} as T)
}
