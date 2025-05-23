import { IEntity } from '../../external'

export interface IAbsentProductEntity extends IEntity {
  cityId: string
  shopId: string
  createDate: string
  expiresAt: number
  queryName: string
  hash: string
}
