import { IEntity } from '../../external'

export interface IUserEntity extends IEntity {
  telegramId: number
  telegramLogin?: string
  telegramFirstName?: string
  telegramLastName?: string
  createDate: string
  lastActivityDate: string
  actualCityId: string
}
