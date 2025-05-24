import { EntityIsNotUniqueError } from '../errors'
import { OperationGuardian } from '@shared'

export const uniqueEntity = <TContext, TParams>(
  checker: (context: TContext, params: TParams) => Promise<number | object | null>
): OperationGuardian<TContext, TParams> => {
  return async (context, params) => {
    const result = await checker(context, params)

    if ((typeof result === 'number' && result > 0) || result) {
      return new EntityIsNotUniqueError()
    }
  }
}
