import { IQueryableRepo, ISession, IQueryBuilder } from '../types'

export abstract class AbstractQueryableRepo<TQuery, TEntity extends object> implements IQueryableRepo<TEntity> {
  protected abstract getQuery: () => IQueryBuilder<TEntity>

  get query() {
    return this.getQuery().registerBeforeExecutionMiddleware(q => this.queryingMiddleware(q))
  }

  protected abstract queryingMiddleware: (query: IQueryBuilder<TEntity>) => IQueryBuilder<TEntity> | Promise<IQueryBuilder<TEntity>>

  protected constructor(protected session: ISession<TQuery>, public collectionName: string) {}
}
