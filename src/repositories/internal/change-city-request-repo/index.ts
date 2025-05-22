import { IChangeCityRequestEntity } from './types'
import { DataBaseSession, IUpdatableRepo } from '../../types'
import { DataBaseUpdatableRepo, IQueryBuilder } from '../../external'

export * from './types'

export class ChangeCityRequestRepo
  extends DataBaseUpdatableRepo<IChangeCityRequestEntity>
  implements IUpdatableRepo<IChangeCityRequestEntity>
{
  static collectionName = 'changeCityRequests' as const

  constructor(dbSession: DataBaseSession) {
    super(dbSession, ChangeCityRequestRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<IChangeCityRequestEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: IChangeCityRequestEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: IChangeCityRequestEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: IChangeCityRequestEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
