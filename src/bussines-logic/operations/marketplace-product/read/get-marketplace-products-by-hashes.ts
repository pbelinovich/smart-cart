import { buildReadOperation } from '../../../common/read'

export interface IGetMarketplaceProductByHashParams {
  hashes: string[]
}

export const getMarketplaceProductsByHashes = buildReadOperation((context, params: IGetMarketplaceProductByHashParams) => {
  return context.marketplaceProductRepo.query.where((_, p) => _.in(p('hash'), params.hashes)).all()
})
