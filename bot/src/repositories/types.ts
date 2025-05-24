import { EntityEvent } from './external'
import { ISessionEntity } from './internal'

export { EntityEvent, IEntity, IUpdatableRepo, INonUpdatableRepo } from './external'

export type SessionEntityEvents = EntityEvent<ISessionEntity>

export type DataBaseEvent = {
  entity: 'sessions'
  event: SessionEntityEvents
}
