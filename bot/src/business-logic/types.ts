import { IOperation, IOperationExecutor } from '@shared'
import { ISessionEntity, IReadOnlyRepo, IUpdatableRepo } from './external'

export {
  FilterInfo,
  EntityEvent,
  IEntity,
  ISessionEntity,
  IReadOnlyRepo,
  IUpdatableRepo,
  QueryFiltersGetter,
  IQueryableRepo,
  IQueryBuilder,
} from './external'

export interface IReadOperationContext {
  sessionRepo: IReadOnlyRepo<ISessionEntity>
}

export interface IWriteOperationContext {
  sessionRepo: IUpdatableRepo<ISessionEntity>
  readExecutor: IOperationExecutor<IReadOperationContext>
}

export interface IReadOperation<TParams, TResult> extends IOperation<IReadOperationContext, TParams, TResult> {}

export interface IWriteOperation<TParams, TResult> extends IOperation<IWriteOperationContext, TParams, TResult> {}
