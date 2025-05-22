import { buildReadOperation } from '../../../common/read'
import { ICoordinates } from '../../../external'

export interface IGetEdadealChercherAreaParams {
  coordinates: ICoordinates
}

export const getEdadealChercherArea = buildReadOperation((context, params: IGetEdadealChercherAreaParams) => {
  return context.edadealRepo.getChercherArea(params)
}, [])
