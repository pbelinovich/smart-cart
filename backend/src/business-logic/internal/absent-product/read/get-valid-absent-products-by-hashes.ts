import { buildReadOperation } from '../../../common/read'

export interface IGetValidAbsentProductsByHashesParams {
  hashes: string[]
}

export const getValidAbsentProductsByHashes = buildReadOperation((context, params: IGetValidAbsentProductsByHashesParams) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return context.absentProductRepo.query.where((_, p) => _.and(_.in(p('hash'), params.hashes), _.gt(p('expiresAt'), nowInSeconds))).all()
})
