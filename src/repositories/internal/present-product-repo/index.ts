import { IPresentProductEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class PresentProductRepo extends DataBaseUpdatableRepo<IPresentProductEntity> implements IUpdatableRepo<IPresentProductEntity> {
  static collectionName = 'presentProducts' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, PresentProductRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<IPresentProductEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IPresentProductEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IPresentProductEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IPresentProductEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
