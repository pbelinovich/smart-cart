import { IOperation, OperationGuardian, OperationHandler } from './types'

export const createOperationBuilder =
  <TContext>() =>
  <TParams, TResult>(
    handler: OperationHandler<TContext, TParams, TResult>,
    guardians: OperationGuardian<TContext, TParams>[] | null = null
  ): IOperation<TContext, TParams, TResult> => ({
    handler,
    guardians,
  })
