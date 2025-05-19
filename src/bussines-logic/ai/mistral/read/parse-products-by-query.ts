import { buildReadOperation } from '../../../common/read'

export interface IParseProductsByQueryParams {
  query: string
}

export const parseProductsByQuery = buildReadOperation((context, params: IParseProductsByQueryParams) => {
  return context.mistralRepo.parse(params.query)
}, [])
