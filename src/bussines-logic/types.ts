import {
  IUserEntity,
  IReadOnlyRepo,
  IUpdatableRepo,
  IAIProductsListEntity,
  IMarketplaceProductEntity,
  IProductEntity,
  IProductsRequestEntity,
} from './external'
import { IOperation, IOperationExecutor } from '@shared'

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
  aiProductsListRepo: IReadOnlyRepo<IAIProductsListEntity>
  marketplaceProductRepo: IReadOnlyRepo<IMarketplaceProductEntity>
  productRepo: IReadOnlyRepo<IProductEntity>
  productsRequestRepo: IReadOnlyRepo<IProductsRequestEntity>
  userRepo: IReadOnlyRepo<IUserEntity>
}

export interface IWriteOperationContext {
  aiProductsListRepo: IUpdatableRepo<IAIProductsListEntity>
  marketplaceProductRepo: IUpdatableRepo<IMarketplaceProductEntity>
  productRepo: IUpdatableRepo<IProductEntity>
  productsRequestRepo: IUpdatableRepo<IProductsRequestEntity>
  userRepo: IUpdatableRepo<IUserEntity>

  readExecutor: IOperationExecutor<IReadOperationContext>
}

export interface IReadOperation<TParams, TResult> extends IOperation<IReadOperationContext, TParams, TResult> {}

export interface IWriteOperation<TParams, TResult> extends IOperation<IWriteOperationContext, TParams, TResult> {}
