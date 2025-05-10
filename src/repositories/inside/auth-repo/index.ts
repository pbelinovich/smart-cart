import { IAuthEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class AuthRepo extends DataBaseUpdatableRepo<IAuthEntity> implements IUpdatableRepo<IAuthEntity> {
  constructor(dbSession: DataBaseSession) {
    super(dbSession, 'auths')
  }

  protected queryingMiddleware = (query: IQueryBuilder<IAuthEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IAuthEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IAuthEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IAuthEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
