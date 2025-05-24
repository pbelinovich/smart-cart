import { buildWriteOperation } from '../../../common/write'

export interface IRemoveAbsentProductParams {
  id: string
}

export const removeAbsentProduct = buildWriteOperation((context, params: IRemoveAbsentProductParams) => {
  return context.absentProductRepo.remove(params.id)
}, [])
