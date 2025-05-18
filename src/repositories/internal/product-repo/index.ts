import { IProductEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class ProductRepo extends DataBaseUpdatableRepo<IProductEntity> implements IUpdatableRepo<IProductEntity> {
  static collectionName = 'products' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, ProductRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<IProductEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IProductEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IProductEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IProductEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
