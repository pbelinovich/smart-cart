import { buildReadOperation } from '../../../common/read'

export interface ISearchEdadealCitiesParams {
  query: string
}

export const searchEdadealCities = buildReadOperation((context, params: ISearchEdadealCitiesParams) => {
  return context.edadealRepo.searchCities(params)
}, [])
