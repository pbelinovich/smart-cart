import { IOperation, IOperationExecutor } from '@shared'
import {
  IUserEntity,
  IReadOnlyRepo,
  IUpdatableRepo,
  IPresentProductEntity,
  IProductsRequestEntity,
  IProductsResponseEntity,
  MistralRepo,
  EdadealRepo,
  IAbsentProductEntity,
} from './external'

export {
  FilterInfo,
  EntityEvent,
  IEntity,
  IUserEntity,
  ICoordinates,
  IReadOnlyRepo,
  IUpdatableRepo,
  QueryFiltersGetter,
  IQueryableRepo,
  IQueryBuilder,
} from './external'

export interface IReadOperationContext {
  absentProductRepo: IReadOnlyRepo<IAbsentProductEntity>
  presentProductRepo: IReadOnlyRepo<IPresentProductEntity>
  productsRequestRepo: IReadOnlyRepo<IProductsRequestEntity>
  productsResponseRepo: IReadOnlyRepo<IProductsResponseEntity>
  userRepo: IReadOnlyRepo<IUserEntity>

  mistralRepo: MistralRepo
  edadealRepo: EdadealRepo
}

export interface IWriteOperationContext {
  absentProductRepo: IUpdatableRepo<IAbsentProductEntity>
  presentProductRepo: IUpdatableRepo<IPresentProductEntity>
  productsRequestRepo: IUpdatableRepo<IProductsRequestEntity>
  productsResponseRepo: IUpdatableRepo<IProductsResponseEntity>
  userRepo: IUpdatableRepo<IUserEntity>

  mistralRepo: MistralRepo
  edadealRepo: EdadealRepo

  readExecutor: IOperationExecutor<IReadOperationContext>
}

export interface IReadOperation<TParams, TResult> extends IOperation<IReadOperationContext, TParams, TResult> {}

export interface IWriteOperation<TParams, TResult> extends IOperation<IWriteOperationContext, TParams, TResult> {}
