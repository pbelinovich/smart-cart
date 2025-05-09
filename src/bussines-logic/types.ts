import { IUserEntity, IReadOnlyRepo, IUpdatableRepo, IUserAddressEntity } from './external'
import { IOperation, IOperationExecutor } from '@shared'

export {
  FilterInfo,
  EntityEvent,
  IEntity,
  IUserEntity,
  IUserAddressCoordinates,
  IUserAddressEntity,
  IReadOnlyRepo,
  IUpdatableRepo,
  QueryFiltersGetter,
  IQueryableRepo,
  IQueryBuilder,
} from './external'

export interface IReadOperationContext {
  userRepo: IReadOnlyRepo<IUserEntity>
  userAddressRepo: IReadOnlyRepo<IUserAddressEntity>
}

export interface IWriteOperationContext {
  readExecutor: IOperationExecutor<IReadOperationContext>
  userRepo: IUpdatableRepo<IUserEntity>
  userAddressRepo: IUpdatableRepo<IUserAddressEntity>
}

export interface IReadOperation<TParams, TResult> extends IOperation<IReadOperationContext, TParams, TResult> {}

export interface IWriteOperation<TParams, TResult> extends IOperation<IWriteOperationContext, TParams, TResult> {}
