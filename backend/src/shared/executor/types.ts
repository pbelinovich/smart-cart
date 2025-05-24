import { GuardianValidationError } from './guardian-validation-error'

// true = pass validation, false - validation failed
export type OperationGuardian<TContext, TParams> = (
  context: TContext,
  params: TParams
) => Promise<GuardianValidationError | void> | GuardianValidationError | void

export type OperationHandler<TContext, TParams, TResult> = (
  context: TContext,
  params: TParams,
  executor: IOperationExecutor<TContext>
) => Promise<TResult> | TResult

export interface IOperation<TContext, TParams, TResult> {
  guardians: OperationGuardian<TContext, TParams>[] | null
  handler: OperationHandler<TContext, TParams, TResult>
}

export type ExecutionMiddleware<TContext, TParams, TResult> = (
  execute: () => Promise<TResult>,
  context: TContext,
  params: TParams
) => Promise<TResult>

export interface IOperationExecutor<TContext> {
  validate: <TParams>(operation: IOperation<TContext, TParams, any>, params: TParams) => Promise<GuardianValidationError[]>
  validateSync: <TParams>(operation: IOperation<TContext, TParams, any>, params: TParams) => GuardianValidationError[]
  execute: <TParams, TResult>(operation: IOperation<TContext, TParams, TResult>, params: TParams) => Promise<TResult>
  registerMiddleware: (middleware: ExecutionMiddleware<TContext, any, any>) => () => void
}
