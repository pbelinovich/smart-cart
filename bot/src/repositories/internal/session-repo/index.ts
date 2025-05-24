import { ISessionEntity } from './types'
import { IUpdatableRepo } from '../../types'
import { IQueryBuilder, MemorySession, MemoryUpdatableRepo } from '../../external'

export * from './types'

export class SessionRepo extends MemoryUpdatableRepo<ISessionEntity> implements IUpdatableRepo<ISessionEntity> {
  static collectionName = 'sessions' as const

  constructor(memorySession: MemorySession) {
    super(memorySession, SessionRepo.collectionName)
  }

  protected queryingMiddleware = (query: IQueryBuilder<ISessionEntity>) => {
    return query
  }

  protected getByIdMiddleware = (entity: ISessionEntity) => {
    return entity
  }

  protected updatingMiddleware = (entity: ISessionEntity) => {
    return entity
  }

  protected creationMiddleware = (entity: ISessionEntity) => {
    return entity
  }

  protected removingMiddleware = () => undefined
}
