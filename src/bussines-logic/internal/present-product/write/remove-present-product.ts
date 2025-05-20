import { buildWriteOperation } from '../../../common/write'

export interface IRemovePresentProductParams {
  id: string
}

export const removePresentProduct = buildWriteOperation((context, params: IRemovePresentProductParams) => {
  return context.presentProductRepo.remove(params.id)
}, [])
