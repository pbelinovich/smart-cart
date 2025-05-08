import { FilterInfo } from '../types'
import isEqual from 'react-fast-compare'
import { dateTime, getStateByPath, NOT_FOUND } from '@shared'

const filterFuncs: { [key: string]: (expVal: any) => (actualVal: any) => boolean } = {
  contains: (expectedVal: any) => (actualVal: string) => {
    if (Array.isArray(actualVal)) {
      return actualVal.indexOf(expectedVal) !== -1
    }
    return actualVal.toLocaleLowerCase().indexOf(expectedVal.toLocaleLowerCase()) !== -1
  },
  eq: (expectedVal: any) => (actualVal: string) => actualVal === expectedVal,
  ne: (expectedVal: any) => (actualVal: string) => actualVal !== expectedVal,

  in: (expectedVal: any) => (actualVal: string) => expectedVal.indexOf(actualVal) !== -1,
  ge: (expectedVal: any) => (actualVal: string) => {
    if (/^\d\d\d\d-\d\d-\d\d$/.test(actualVal)) {
      return dateTime.utc(actualVal).isSameOrAfter(dateTime.utc(expectedVal))
    }
    return actualVal >= expectedVal
  },

  le: (expectedVal: any) => (actualVal: string) => {
    if (/^\d\d\d\d-\d\d-\d\d$/.test(actualVal)) {
      return dateTime.utc(actualVal).isSameOrBefore(dateTime.utc(expectedVal))
    }
    return actualVal <= expectedVal
  },
  someContains: (expectedVal: any) => (actualVal: string[]) =>
    actualVal.some(v => v.toLocaleLowerCase().indexOf(expectedVal.toLocaleLowerCase()) !== -1),
}

export const passingFilter = (
  obj: any,
  filtersObj: FilterInfo,
  filtersByCategories: {
    [key: string]: FilterInfo | undefined
  }
): boolean => {
  if (filtersObj.type === 'and') {
    return filtersObj.operands.every(x => passingFilter(obj, x, filtersByCategories))
  }

  if (filtersObj.type === 'or') {
    return filtersObj.operands.some(x => passingFilter(obj, x, filtersByCategories))
  }

  if (filtersObj.type === 'condition') {
    if (filtersObj.field === 'category') {
      const categoryFilters = filtersByCategories[filtersObj.value]
      return categoryFilters ? passingFilter(obj, categoryFilters, filtersByCategories) : true
    }
    const condition = filterFuncs[filtersObj.predicate]

    if (!condition) {
      throw new Error(`Unable to filter list! Unknown predicate ${filtersObj.predicate}`)
    }

    const value = getStateByPath(filtersObj.field.split('.'), obj)
    if (value === NOT_FOUND) {
      return false
    }
    return condition(filtersObj.value)(value)
  }
  return false
}

export const filterArray = <TRow>(
  data: TRow[],
  filtersObj: FilterInfo,
  filtersByCategories: { [key: string]: FilterInfo | undefined }
): TRow[] => {
  return data.filter(x => passingFilter(x, filtersObj, filtersByCategories))
}

// Хоть сортировка по нескольким полям заложена в API она сейчас не реализована тут!
export const sortArray = <TRow>(data: TRow[], sort: { field: string; direction: 'ASC' | 'DESC' }[]): TRow[] => {
  if (sort.length === 0) {
    return data
  }
  const field = sort[0].field
  const direction = sort[0].direction
  const path = field.split('.')
  const result = [...data].sort((a: any, b: any) => {
    const aValue = getStateByPath(path, a)
    const bValue = getStateByPath(path, b)

    if (aValue === NOT_FOUND && bValue === NOT_FOUND) {
      return 0
    }
    if (aValue === NOT_FOUND && bValue !== NOT_FOUND) {
      return -1
    }
    if (aValue !== NOT_FOUND && bValue === NOT_FOUND) {
      return 1
    }

    if (aValue > bValue) {
      return 1
    }
    if (aValue < bValue) {
      return -1
    }
    return 0
  })

  return direction === 'ASC' ? result : result.reverse()
}

export const getUniqueObjects = <T>(arr: T[]): T[] => {
  const uniqueArray: T[] = []

  for (const item of arr) {
    if (!uniqueArray.some(existingItem => isEqual(existingItem, item))) {
      uniqueArray.push(item)
    }
  }

  return uniqueArray
}
