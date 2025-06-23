import { buildReadOperation } from '../../../common/read'

export interface IGetValidPresentProductsByHashesParams {
  hashes: string[]
}

export const getValidPresentProductsByHashes = buildReadOperation((context, params: IGetValidPresentProductsByHashesParams) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return context.presentProductRepo.query.where((_, p) => _.and(_.in(p('hash'), params.hashes), _.gt(p('expiresAt'), nowInSeconds))).all()
})
