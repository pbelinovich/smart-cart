import { IUserEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class UserRepo extends DataBaseUpdatableRepo<IUserEntity> implements IUpdatableRepo<IUserEntity> {
  static collectionName = 'users' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, UserRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<IUserEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IUserEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IUserEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IUserEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
