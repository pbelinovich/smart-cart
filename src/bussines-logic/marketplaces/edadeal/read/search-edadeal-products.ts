import { buildReadOperation } from '../../../common/read'
import { EdadealSort, ICoordinates } from '../../../external'

export interface ISearchEdadealProductsParams {
  coordinates: ICoordinates
  chercherArea: string
  shopIds: string[]
  sort?: EdadealSort
  text: string
}

export const searchEdadealProducts = buildReadOperation((context, params: ISearchEdadealProductsParams) => {
  return context.edadealRepo.searchProducts(params)
}, [])
