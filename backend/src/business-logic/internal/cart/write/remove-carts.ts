import { buildWriteOperation } from '../../../common/write'

export interface IRemoveCartsParams {
  ids: string[]
}

export const removeCarts = buildWriteOperation(async (context, params: IRemoveCartsParams) => {
  await Promise.all(params.ids.map(id => context.cartRepo.remove(id)))
}, [])
