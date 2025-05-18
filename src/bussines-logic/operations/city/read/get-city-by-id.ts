import { buildReadOperation } from '../../../common/read'
import { cities } from './mock'

export interface IGetCityByIdParams {
  id: string
}

export const getCityById = buildReadOperation((_, params: IGetCityByIdParams) => {
  return cities.find(city => city.id === params.id)
}, [])
