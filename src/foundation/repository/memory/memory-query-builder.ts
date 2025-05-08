import { pathGenerator } from '../../../shared/path-generator'
import { filterBuilder } from '../common'
import { entityToDTO } from '../tools'
import { MemoryQuery } from './memory-query'
import { IEntity, IQueryBuilder, OrderDirection, QueryFiltersGetter, QueryMiddleware, QueryPathGetter } from '../types'

export class MemoryQueryBuilder<T extends IEntity> implements IQueryBuilder<T> {
  private readonly path = pathGenerator<T>()
  private _middlewaresApplied = false

  constructor(protected query: MemoryQuery<T>, protected beforeExecutionMiddlewares: Array<QueryMiddleware<T>>) {}

  private applyMiddlewaresToQuery = async () => {
    if (this._middlewaresApplied) {
      return
    }

    for (const middleware of this.beforeExecutionMiddlewares) {
      this.query = ((await middleware(this)) as this).query
    }

    this._middlewaresApplied = true
  }

  registerBeforeExecutionMiddleware = (middleware: QueryMiddleware<T>) => {
    return new MemoryQueryBuilder(this.query, [...this.beforeExecutionMiddlewares, middleware])
  }

  distinct = () => {
    const query = this.query.setDistinct()
    return new MemoryQueryBuilder(query, this.beforeExecutionMiddlewares)
  }

  where = (filtersGetter: QueryFiltersGetter<T>) => {
    const filterInfo = filtersGetter(filterBuilder, this.path)
    const query = this.query.setFilters(filterInfo)
    return new MemoryQueryBuilder(query, this.beforeExecutionMiddlewares)
  }

  all = () => this.allWithCount().then(x => x.data)

  allWithCount = async () => {
    await this.applyMiddlewaresToQuery()
    return this.query.allWithCount().then(x => ({ data: x.data.map(entityToDTO), size: x.size }))
  }

  first = async () => {
    await this.applyMiddlewaresToQuery()
    return this.query.first().then(entityToDTO)
  }

  firstOrNull = async () => {
    await this.applyMiddlewaresToQuery()
    return this.query.firstOrNull().then(x => (x ? entityToDTO(x) : x))
  }

  count = async () => {
    await this.applyMiddlewaresToQuery()
    return this.query.count()
  }

  take = (count: number) => {
    const query = this.query.take(count)
    return new MemoryQueryBuilder(query, this.beforeExecutionMiddlewares)
  }

  skip = (count: number) => {
    const query = this.query.skip(count)
    return new MemoryQueryBuilder(query, this.beforeExecutionMiddlewares)
  }

  order = (pathGetter: QueryPathGetter<T>, direction?: OrderDirection) => {
    const field = pathGetter(this.path)
    const query = this.query.order(field, direction)
    return new MemoryQueryBuilder(query, this.beforeExecutionMiddlewares)
  }

  numericOrder = (pathGetter: QueryPathGetter<T>, direction?: OrderDirection) => {
    const field = pathGetter(this.path)
    const query = this.query.numericOrder(field, direction)
    return new MemoryQueryBuilder(query, this.beforeExecutionMiddlewares)
  }
}
