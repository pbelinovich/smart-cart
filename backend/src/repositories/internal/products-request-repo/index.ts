import { IProductsRequestEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class ProductsRequestRepo extends DataBaseUpdatableRepo<IProductsRequestEntity> implements IUpdatableRepo<IProductsRequestEntity> {
  static collectionName = 'productsRequests' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, ProductsRequestRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<IProductsRequestEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IProductsRequestEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IProductsRequestEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IProductsRequestEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
