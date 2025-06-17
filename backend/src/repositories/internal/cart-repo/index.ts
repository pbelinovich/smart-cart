import { ICartEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class CartRepo extends DataBaseUpdatableRepo<ICartEntity> implements IUpdatableRepo<ICartEntity> {
  static collectionName = 'carts' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, CartRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<ICartEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: ICartEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: ICartEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: ICartEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
