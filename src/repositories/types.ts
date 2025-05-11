import { EntityEvent } from './external'
import { MessagesBasedCommunicator } from '@shared'
import { IUserEntity } from './inside'

export { EntityEvent, IEntity, DataBaseSession, IUpdatableRepo, INonUpdatableRepo } from './external'

export type UserEntityEvents = EntityEvent<IUserEntity>

export type DataBaseEvent = {
  entity: 'users'
  event: UserEntityEvents
}

export type ProcessNames = 'parseProducts'
export type ProcessMessages = 'dbEvent'
export type ProcessCommunicator = MessagesBasedCommunicator<ProcessNames, ProcessMessages>

export type UserPriceCategory = 'cheapest' | 'popular' | 'mostExpensive'

export interface IUserProduct {
  name: string
  quantity: string
  priceCategory: UserPriceCategory
}

export interface ICoordinates {
  latitude: number
  longitude: number
}

export type Marketplace = 'igooods'
export type AuthData = { [key: string]: any }
