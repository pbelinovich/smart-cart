import { IUserEntity, IReadOnlyRepo, IUpdatableRepo } from './external'
import { IOperation, IOperationExecutor } from '@shared'

export {
  FilterInfo,
  EntityEvent,
  IEntity,
  IUserEntity,
  IReadOnlyRepo,
  IUpdatableRepo,
  QueryFiltersGetter,
  IQueryableRepo,
  IQueryBuilder,
} from './external'

export interface IReadOperationContext {
  userRepo: IReadOnlyRepo<IUserEntity>
}

export interface IWriteOperationContext {
  readExecutor: IOperationExecutor<IReadOperationContext>
  userRepo: IUpdatableRepo<IUserEntity>
}

export interface IReadOperation<TParams, TResult> extends IOperation<IReadOperationContext, TParams, TResult> {}

export interface IWriteOperation<TParams, TResult> extends IOperation<IWriteOperationContext, TParams, TResult> {}
