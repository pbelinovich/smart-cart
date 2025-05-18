import { buildWriteOperation } from '../../../common/write'

export interface IRemoveProductsRequestsParams {
  ids: string[]
}

export const removeProductsRequests = buildWriteOperation(async (context, params: IRemoveProductsRequestsParams) => {
  const [aiProductsLists, products] = await Promise.all([
    context.aiProductsListRepo.query.where((_, p) => _.in(p('productsRequestId'), params.ids)).all(),
    context.productRepo.query.where((_, p) => _.in(p('productsRequestId'), params.ids)).all(),
  ])

  await Promise.all([
    ...aiProductsLists.map(aiProductsList => context.aiProductsListRepo.remove(aiProductsList.id)),
    ...products.map(product => context.productRepo.remove(product.id)),
    ...params.ids.map(id => context.productsRequestRepo.remove(id)),
  ])
}, [])
