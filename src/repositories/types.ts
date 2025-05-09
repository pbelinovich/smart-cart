import { EntityEvent } from './external'
import { MessagesBasedCommunicator } from '@shared'
import { IUserEntity } from './inside'

export { EntityEvent, IEntity, DataBaseSession, IUpdatableRepo, INonUpdatableRepo } from './external'

export type UserEntityEvents = EntityEvent<IUserEntity>

export type DataBaseEvent = {
  entity: 'users'
  event: UserEntityEvents
}

export type ProcessNames = 'stringToFoodList'
export type ProcessMessages = 'dbEvent'
export type ProcessCommunicator = MessagesBasedCommunicator<ProcessNames, ProcessMessages>
