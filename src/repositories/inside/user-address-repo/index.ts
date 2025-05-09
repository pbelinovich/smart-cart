import { IUserAddressEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class UserAddressRepo extends DataBaseUpdatableRepo<IUserAddressEntity> implements IUpdatableRepo<IUserAddressEntity> {
  constructor(dbSession: DataBaseSession) {
    super(dbSession, 'usersAddresses')
  }

  protected queryingMiddleware = (query: IQueryBuilder<IUserAddressEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IUserAddressEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IUserAddressEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IUserAddressEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
