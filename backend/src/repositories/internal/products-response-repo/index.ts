import { IProductsResponseEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class ProductsResponseRepo
  extends DataBaseUpdatableRepo<IProductsResponseEntity>
  implements IUpdatableRepo<IProductsResponseEntity>
{
  static collectionName = 'productsResponses' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, ProductsResponseRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<IProductsResponseEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IProductsResponseEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IProductsResponseEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IProductsResponseEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
