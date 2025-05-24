import { buildReadOperation } from '../../../common/read'

export interface IGetPresentProductByHashParams {
  hashes: string[]
}

export const getPresentProductsByHashes = buildReadOperation((context, params: IGetPresentProductByHashParams) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return context.presentProductRepo.query.where((_, p) => _.and(_.in(p('hash'), params.hashes), _.gt(p('expiresAt'), nowInSeconds))).all()
})
