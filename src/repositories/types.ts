import { EntityEvent, IEntity } from './external'

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
