import { IQueryBuilder, OrderDirection, QueryFiltersGetter, QueryMiddleware, QueryPathGetter } from '../types'
import { pathGenerator } from '../../../shared/path-generator'
import { filterBuilder } from '../common'
import { entityToDTO } from '../tools'
import { IDocumentQuery, OrderingType, QueryStatistics } from 'ravendb'
import { applyFiltersToQuery } from './apply-filters-to-query'

export class DataBaseQueryBuilder<T extends object> implements IQueryBuilder<T> {
  private readonly path = pathGenerator<T>()
  private _middlewaresApplied = false

  constructor(protected query: IDocumentQuery<T>, protected beforeExecutionMiddlewares: Array<QueryMiddleware<T>>) {}

  private applyMiddlewaresToQuery = async () => {
    if (this._middlewaresApplied) {
      return
    }

    for (const middleware of this.beforeExecutionMiddlewares) {
      this.query = ((await middleware(this)) as this).query
    }

    this._middlewaresApplied = true
  }

  private addOrder = (pathGetter: QueryPathGetter<T>, direction: 'ASC' | 'DESC' = 'DESC', orderingType: OrderingType = 'String') => {
    const field = pathGetter(this.path)
    const query = this.query.addOrder(field, direction === 'DESC', orderingType)
    return new DataBaseQueryBuilder(query, this.beforeExecutionMiddlewares)
  }

  registerBeforeExecutionMiddleware = (middleware: QueryMiddleware<T>) => {
    return new DataBaseQueryBuilder(this.query, [...this.beforeExecutionMiddlewares, middleware])
  }

  where = (getter: QueryFiltersGetter<T>) => {
    const filterInfo = getter(filterBuilder, this.path)
    const query = applyFiltersToQuery(this.query, filterInfo)
    return new DataBaseQueryBuilder(query, this.beforeExecutionMiddlewares)
  }

  distinct = () => {
    const query = this.query.distinct()
    return new DataBaseQueryBuilder(query, this.beforeExecutionMiddlewares)
  }

  all = async () => {
    await this.applyMiddlewaresToQuery()
    return this.query.all().then(x => x.map(entityToDTO))
  }

  allWithCount = async () => {
    let stats: QueryStatistics | undefined
    this.query = this.query.statistics(s => (stats = s))
    return { data: await this.all(), size: stats ? stats.totalResults : 0 }
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
    return new DataBaseQueryBuilder(query, this.beforeExecutionMiddlewares)
  }

  skip = (count: number) => {
    const query = this.query.skip(count)
    return new DataBaseQueryBuilder(query, this.beforeExecutionMiddlewares)
  }

  order = (pathGetter: QueryPathGetter<T>, direction?: OrderDirection) => {
    return this.addOrder(pathGetter, direction)
  }

  numericOrder = (pathGetter: QueryPathGetter<T>, direction?: OrderDirection) => {
    return this.addOrder(pathGetter, direction, 'AlphaNumeric')
  }
}
