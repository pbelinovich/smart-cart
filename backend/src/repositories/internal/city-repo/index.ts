import { ICityEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class CityRepo extends DataBaseUpdatableRepo<ICityEntity> implements IUpdatableRepo<ICityEntity> {
  static collectionName = 'cities' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, CityRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<ICityEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: ICityEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: ICityEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: ICityEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
