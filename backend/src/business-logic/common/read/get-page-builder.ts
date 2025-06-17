import { OperationGuardian } from '@shared'
import {
  FiltersByCategories,
  IReadOperation,
  IReadOperationContext,
  FilterInfo,
  IGetPageRequestParams,
  IGetPageResponse,
  IQueryBuilder,
} from '../../types'

export const combineCategoryFilters = <TCategories extends string>(
  filterInfo: FilterInfo | undefined,
  filtersByCategories?: FiltersByCategories<TCategories>
): FilterInfo | undefined => {
  if (!filterInfo) return

  if (filterInfo.type === 'and' || filterInfo.type === 'or') {
    const operands: FilterInfo[] = []

    for (let i = 0; i < filterInfo.operands.length; i++) {
      const operand = combineCategoryFilters(filterInfo.operands[i], filtersByCategories)
      if (operand) operands.push(operand)
    }

    if (operands.length === 0) return
    if (operands.length === 1) return operands[0]

    return { type: filterInfo.type, operands }
  }

  if (filterInfo.type === 'condition' && filterInfo.field === 'category') {
    return combineCategoryFilters(filtersByCategories ? (filtersByCategories as any)[filterInfo.value] : undefined, filtersByCategories)
  }

  return filterInfo
}

export const buildGetPageOperation = <T extends object, TMapped, TCategories extends string>(
  queryGetter: (context: IReadOperationContext, metadata: IGetPageRequestParams) => IQueryBuilder<T> | Promise<IQueryBuilder<T>>,
  mapper: (entity: T) => TMapped,
  filtersByCategories?: FiltersByCategories<TCategories>,
  guardians?: OperationGuardian<IReadOperationContext, IGetPageRequestParams>[]
): IReadOperation<IGetPageRequestParams, IGetPageResponse<TMapped>> => ({
  guardians: guardians || null,
  handler: async (context, metadata) => {
    let query = await queryGetter(context, metadata)

    if (metadata.filter) {
      const combinedFilter = combineCategoryFilters(metadata.filter.data, filtersByCategories)
      query = query.where(() => combinedFilter)
    }

    if (metadata.sort) {
      metadata.sort.forEach(
        x => (query = x.numeric ? query.numericOrder(() => x.field, x.direction) : query.order(() => x.field, x.direction))
      )
    }

    if (metadata.paging) {
      query = query.skip(metadata.paging.offset).take(metadata.paging.limit)
    }

    const result = await query.allWithCount()

    return {
      data: result.data.map(x => mapper(x)),
      total: result.size,
    }
  },
})
