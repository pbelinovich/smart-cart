import { buildReadOperation } from '../../../common/read'

export interface IGetAbsentProductsByHashesParams {
  hashes: string[]
}

export const getAbsentProductsByHashes = buildReadOperation((context, params: IGetAbsentProductsByHashesParams) => {
  return context.absentProductRepo.query.where((_, p) => _.in(p('hash'), params.hashes)).all()
})
