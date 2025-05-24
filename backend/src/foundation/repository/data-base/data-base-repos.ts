import { AbstractNonUpdatableRepo, AbstractUpdatableRepo, AbstractQueryableRepo } from '../common'
import { IEntity } from '../types'
import { DataBaseQueryBuilder } from './data-base-query-builder'
import { IDocumentQuery } from 'ravendb'

export abstract class DataBaseIndexRepo<T extends object> extends AbstractQueryableRepo<IDocumentQuery<T>, T> {
  protected getQuery = () => new DataBaseQueryBuilder<T>(this.session.query(this.collectionName, true) as any, [])
}

export abstract class DataBaseNonUpdatableRepo<T extends IEntity> extends AbstractNonUpdatableRepo<IDocumentQuery<T>, T> {
  protected getQuery = () => new DataBaseQueryBuilder(this.session.query(this.collectionName, false), [])
}

export abstract class DataBaseUpdatableRepo<T extends IEntity> extends AbstractUpdatableRepo<IDocumentQuery<T>, T> {
  protected getQuery = () => new DataBaseQueryBuilder(this.session.query(this.collectionName, false), [])
}
