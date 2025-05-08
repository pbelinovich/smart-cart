import { IUserEntity, DataBaseSession, IUpdatableRepo } from './types'
import { DataBaseUpdatableRepo, IQueryBuilder } from './external'

export class UserRepo extends DataBaseUpdatableRepo<IUserEntity> implements IUpdatableRepo<IUserEntity> {
  constructor(dbSession: DataBaseSession) {
    super(dbSession, 'users')
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
