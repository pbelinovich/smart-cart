import { IEntity } from '../../external'
import { ICity } from '../../types'

export type ChangeCityRequestStatus =
  | 'created'
  | 'citiesSearching'
  | 'citiesFound'
  | 'citySelected'
  | 'chercherAreaGetting'
  | 'userCityUpdated'
  | 'canceledByUser'

export interface IChangeCityRequestEntity extends IEntity {
  userId: string
  createDate: string
  modifyDate?: string
  expiresAt: number
  query: string
  status: ChangeCityRequestStatus
  error: boolean
  cities: ICity[]
  selectedCityId?: string
}
