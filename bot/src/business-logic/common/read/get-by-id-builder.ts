import { IReadOperation, IReadOperationContext, IEntity, IReadOnlyRepo } from '../../types'
import { OperationGuardian } from '@shared'

export const buildGetByIdOperation = <T extends IEntity>(
  repoGetter: (context: IReadOperationContext) => IReadOnlyRepo<T>,
  guardians?: OperationGuardian<IReadOperationContext, { id: string }>[]
): IReadOperation<{ id: string }, T> => ({
  guardians: guardians || null,
  handler: (context, params) => {
    return repoGetter(context).getById(params.id)
  },
})
