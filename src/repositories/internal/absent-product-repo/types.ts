import { IEntity } from '../../external'

export interface IAbsentProductEntity extends IEntity {
  cityId: string
  shopId: string
  createDate: string
  queryName: string
  hash: string
}
