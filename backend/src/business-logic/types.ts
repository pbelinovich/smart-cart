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
  ICityEntity,
  IChangeCityRequestEntity,
  ICartEntity,
  FilterInfo,
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
  cartRepo: IReadOnlyRepo<ICartEntity>
  changeCityRequestRepo: IReadOnlyRepo<IChangeCityRequestEntity>
  cityRepo: IReadOnlyRepo<ICityEntity>
  presentProductRepo: IReadOnlyRepo<IPresentProductEntity>
  productsRequestRepo: IReadOnlyRepo<IProductsRequestEntity>
  productsResponseRepo: IReadOnlyRepo<IProductsResponseEntity>
  userRepo: IReadOnlyRepo<IUserEntity>

  mistralRepo: MistralRepo
  edadealRepo: EdadealRepo
}

export interface IWriteOperationContext {
  absentProductRepo: IUpdatableRepo<IAbsentProductEntity>
  cartRepo: IUpdatableRepo<ICartEntity>
  changeCityRequestRepo: IUpdatableRepo<IChangeCityRequestEntity>
  cityRepo: IUpdatableRepo<ICityEntity>
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

export type FiltersByCategories<T extends string> = { [K in T]: FilterInfo | undefined }

export type CountsByCategories<T extends string> = { [K in T]: number }

export interface IGetPageRequestParams {
  filter?: {
    data: FilterInfo
  }
  sort?: Array<{
    field: string
    direction: 'ASC' | 'DESC'
    numeric?: boolean
  }>
  paging?: {
    offset: number
    limit: number
  }
}

export interface IGetPageResponse<T> {
  data: T[]
  total: number
}
