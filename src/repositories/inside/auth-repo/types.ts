import { IEntity } from '../../external'
import { AuthData, Marketplace } from '../../types'

export interface IAuthEntity extends IEntity {
  userId: string
  createDate: string
  marketplace: Marketplace
  authData: AuthData
}
