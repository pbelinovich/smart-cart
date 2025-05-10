import { IEntity } from '../../external'
import { ICoordinates } from '../../types'

export interface IUserAddressEntity extends IEntity {
  userId: string
  createDate: string
  country: string
  region: string
  city: string
  street: string
  apartment: string
  coordinates: ICoordinates
}
