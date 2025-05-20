import { buildReadOperation } from '../../../common/read'

export interface IGetPresentProductByHashParams {
  hashes: string[]
}

export const getPresentProductsByHashes = buildReadOperation((context, params: IGetPresentProductByHashParams) => {
  return context.presentProductRepo.query.where((_, p) => _.in(p('hash'), params.hashes)).all()
})
