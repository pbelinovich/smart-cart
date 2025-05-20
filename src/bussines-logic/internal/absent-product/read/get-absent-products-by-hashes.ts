import { buildReadOperation } from '../../../common/read'

export interface IGetAbsentProductByHashParams {
  hashes: string[]
}

export const getAbsentProductsByHashes = buildReadOperation((context, params: IGetAbsentProductByHashParams) => {
  return context.absentProductRepo.query.where((_, p) => _.in(p('hash'), params.hashes)).all()
})
