import { IOperation, IOperationExecutor } from '@shared'
import {
  IUserEntity,
  IReadOnlyRepo,
  IUpdatableRepo,
  IAIProductsListEntity,
  IPresentProductEntity,
  IProductEntity,
  IProductsRequestEntity,
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
  aiProductsListRepo: IReadOnlyRepo<IAIProductsListEntity>
  presentProductRepo: IReadOnlyRepo<IPresentProductEntity>
  productRepo: IReadOnlyRepo<IProductEntity>
  productsRequestRepo: IReadOnlyRepo<IProductsRequestEntity>
  userRepo: IReadOnlyRepo<IUserEntity>

  mistralRepo: MistralRepo
  edadealRepo: EdadealRepo
}

export interface IWriteOperationContext {
  absentProductRepo: IUpdatableRepo<IAbsentProductEntity>
  aiProductsListRepo: IUpdatableRepo<IAIProductsListEntity>
  presentProductRepo: IUpdatableRepo<IPresentProductEntity>
  productRepo: IUpdatableRepo<IProductEntity>
  productsRequestRepo: IUpdatableRepo<IProductsRequestEntity>
  userRepo: IUpdatableRepo<IUserEntity>

  mistralRepo: MistralRepo
  edadealRepo: EdadealRepo

  readExecutor: IOperationExecutor<IReadOperationContext>
}

export interface IReadOperation<TParams, TResult> extends IOperation<IReadOperationContext, TParams, TResult> {}

export interface IWriteOperation<TParams, TResult> extends IOperation<IWriteOperationContext, TParams, TResult> {}
