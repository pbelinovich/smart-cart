import { EntityEvent, IEntity } from './external'
import { MessagesBasedCommunicator } from '@shared'

export { EntityEvent, IEntity, DataBaseSession, IUpdatableRepo, INonUpdatableRepo } from './external'

export interface IUserEntity extends IEntity {
  telegramId: number
  createDate: string
  lastActivityDate: string
}

export type UserEntityEvents = EntityEvent<IUserEntity>

export type DataBaseEvent = {
  entity: 'users'
  event: UserEntityEvents
}

export type ProcessNames = 'stringToFoodList'
export type ProcessMessages = 'dbEvent'
export type ProcessCommunicator = MessagesBasedCommunicator<ProcessNames, ProcessMessages>
export type ProcessCommunicatorGetter = () => ProcessCommunicator
