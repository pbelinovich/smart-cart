import { buildReadOperation } from '../../../common/read'

export interface IGetAbsentProductByHashParams {
  hashes: string[]
}

export const getAbsentProductsByHashes = buildReadOperation((context, params: IGetAbsentProductByHashParams) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return context.absentProductRepo.query.where((_, p) => _.and(_.in(p('hash'), params.hashes), _.gt(p('expiresAt'), nowInSeconds))).all()
})
