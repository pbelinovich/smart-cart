import { IAbsentProductEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class AbsentProductRepo extends DataBaseUpdatableRepo<IAbsentProductEntity> implements IUpdatableRepo<IAbsentProductEntity> {
  static collectionName = 'absentProducts' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, AbsentProductRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<IAbsentProductEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IAbsentProductEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IAbsentProductEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IAbsentProductEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
