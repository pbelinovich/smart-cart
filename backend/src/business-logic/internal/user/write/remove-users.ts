import { buildWriteOperation } from '../../../common/write'
import { removeProductsRequests } from '../../products-request'

export interface IRemoveUsersParams {
  ids: string[]
}

export const removeUsers = buildWriteOperation(async (context, params: IRemoveUsersParams, { execute }) => {
  const productsRequests = await context.productsRequestRepo.query.where((_, p) => _.in(p('userId'), params.ids)).all()

  await Promise.all([
    execute(removeProductsRequests, { ids: productsRequests.map(x => x.id) }),
    ...params.ids.map(id => context.userRepo.remove(id)),
  ])
}, [])
