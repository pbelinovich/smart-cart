import { IEntity } from '../../external'

export interface IUserEntity extends IEntity {
  telegramId: number
  createDate: string
  lastActivityDate: string
  currentUserAddressId?: string
}
