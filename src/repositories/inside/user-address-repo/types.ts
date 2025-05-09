import { IEntity } from '../../external'

export interface IUserAddressCoordinates {
  latitude: number
  longitude: number
}

export interface IUserAddressEntity extends IEntity {
  userId: string
  createDate: string
  country: string
  region: string
  city: string
  street: string
  apartment: string
  coordinates: IUserAddressCoordinates
}
