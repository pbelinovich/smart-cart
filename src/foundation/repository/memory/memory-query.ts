import { filterArray, getUniqueObjects, sortArray } from './helpers'
import { FilterInfo, IEntity, LogicFilterInfo, OrderDirection } from '../types'

export class MemoryQuery<T extends IEntity> {
  private filters: FilterInfo | undefined
  private filtersByCategories: { [key: string]: FilterInfo | undefined } = {}
  private offset: number | undefined
  private limit: number | undefined
  private distinct: boolean = false
  private sort: { field: string; direction: 'ASC' | 'DESC' }[] | undefined

  constructor(private readonly collectionName: string, private readonly _all: (collectionName: string) => Promise<T[]>) {}

  setFilters = (filters: FilterInfo | undefined) => {
    this.filters = this.filters
      ? ({
          type: 'and' as const,
          operands: [this.filters, filters],
        } as LogicFilterInfo)
      : filters
    return this
  }

  setDistinct = () => {
    this.distinct = true
    return this
  }

  setFiltersByCategories = (filtersByCategories: { [key: string]: FilterInfo | undefined }) => {
    this.filtersByCategories = filtersByCategories
    return this
  }

  all = async () => {
    const result = await this.allWithCount()
    return result.data
  }

  allWithCount = async () => {
    let result = await this._all(this.collectionName)

    if (this.filters) {
      result = filterArray(result, this.filters, this.filtersByCategories)
    }

    if (this.distinct) {
      result = getUniqueObjects(result)
    }

    if (this.sort) {
      result = sortArray(result, this.sort)
    }

    const totalBeforePagination = result.length

    if (this.offset !== undefined) {
      result = [...result].slice(this.offset, result.length)
    }

    if (this.limit !== undefined) {
      result = [...result].slice(0, this.limit)
    }

    return { data: result, size: totalBeforePagination }
  }

  first = async () => {
    const result = await this.firstOrNull()

    if (result === null) {
      throw new Error('There are no entities')
    }

    return result
  }

  firstOrNull = async () => {
    const result = await this.all()
    return result[0] ?? null
  }

  count = async () => {
    const result = await this.allWithCount()
    return result.size
  }

  take = (count: number) => {
    this.limit = count
    return this
  }

  skip = (count: number) => {
    this.offset = count
    return this
  }

  order = (field: string, direction: OrderDirection = 'DESC') => {
    if (!this.sort) this.sort = []
    this.sort.push({ field, direction })
    return this
  }

  numericOrder = (field: string, direction?: OrderDirection) => {
    return this.order(field, direction)
  }
}
