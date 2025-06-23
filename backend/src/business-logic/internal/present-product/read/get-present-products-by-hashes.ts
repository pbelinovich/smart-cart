import { buildReadOperation } from '../../../common/read'

export interface IGetPresentProductsByHashesParams {
  hashes: string[]
}

export const getPresentProductsByHashes = buildReadOperation((context, params: IGetPresentProductsByHashesParams) => {
  return context.presentProductRepo.query.where((_, p) => _.in(p('hash'), params.hashes)).all()
})
