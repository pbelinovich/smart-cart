import { IAIProductsListEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class AIProductsListRepo extends DataBaseUpdatableRepo<IAIProductsListEntity> implements IUpdatableRepo<IAIProductsListEntity> {
  static collectionName = 'aiProductsLists' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, AIProductsListRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<IAIProductsListEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IAIProductsListEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IAIProductsListEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IAIProductsListEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
