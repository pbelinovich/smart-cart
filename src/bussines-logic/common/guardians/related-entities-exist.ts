import { IEntity, IReadOnlyRepo, QueryFiltersGetter } from '../../external'
import { OperationGuardian } from '@shared'
import { SomeOfRelatedEntitiesNotFound } from '../errors'

export const relatedEntitiesExist =
  <TContext, TParams, TEntity extends IEntity>(
    repoGetter: (context: TContext) => IReadOnlyRepo<TEntity>,
    idsGetter: (params: TParams) => (string | undefined)[] | string | undefined,
    extraChecks?: (params: TParams) => QueryFiltersGetter<TEntity>
  ): OperationGuardian<TContext, TParams> =>
  async (context, params) => {
    const repo = repoGetter(context)
    const idsGetterResult = idsGetter(params)
    const ids = (Array.isArray(idsGetterResult) ? idsGetterResult : [idsGetterResult]).filter(x => x)

    if (ids.length === 0) {
      return
    }

    let query = repo.query.where(_ => _.in('id', ids))

    if (extraChecks) {
      query = query.where(extraChecks(params))
    }

    const foundCount = await query.count()

    if (foundCount !== ids.length) {
      return new SomeOfRelatedEntitiesNotFound()
    }
  }
