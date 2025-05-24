import { GuardianValidationError, OperationExecutionError } from './guardian-validation-error'
import { ExecutionMiddleware, IOperation, IOperationExecutor } from './types'

export type ExecutorTransactionFactory<TContext> = () => {
  context: TContext
  finishTransaction: () => Promise<void>
  abortTransaction: () => Promise<void>
}

export class OperationExecutor<TContext> implements IOperationExecutor<TContext> {
  constructor(beginTransactionOrContext: ExecutorTransactionFactory<TContext> | TContext) {
    if (typeof beginTransactionOrContext === 'function') {
      this.beginTransaction = beginTransactionOrContext as any
    } else {
      this.context = beginTransactionOrContext
    }
  }

  private context: TContext | undefined = undefined
  private beginTransaction: ExecutorTransactionFactory<TContext> | undefined = undefined
  private middlewares: ExecutionMiddleware<TContext, any, any>[] = []

  validateSync = <TParams>(operation: IOperation<TContext, TParams, any>, params: TParams, contextFromParams?: TContext) => {
    let finishTransaction: (() => Promise<any>) | undefined = undefined
    let context: TContext
    if (contextFromParams) {
      context = contextFromParams
    } else if (this.context) {
      context = this.context
    } else if (this.beginTransaction) {
      const transaction = this.beginTransaction()
      finishTransaction = transaction.finishTransaction
      context = transaction.context
    } else {
      throw new Error('Unable to validate operation! Transaction generator has not passed to constructor of current executor!')
    }

    const results = (operation.guardians || []).map(x => x(context, params))
    if (finishTransaction) {
      finishTransaction()
    }
    return results.filter(x => x !== undefined && x instanceof Error) as GuardianValidationError[]
  }

  validate = async <TParams>(operation: IOperation<TContext, TParams, any>, params: TParams, contextFromParams?: TContext) => {
    let finishTransaction: (() => Promise<any>) | undefined = undefined
    let context: TContext
    if (contextFromParams) {
      context = contextFromParams
    } else if (this.context) {
      context = this.context
    } else if (this.beginTransaction) {
      const transaction = this.beginTransaction()
      finishTransaction = transaction.finishTransaction
      context = transaction.context
    } else {
      throw new Error('Unable to validate operation! Transaction generator has not passed to constructor of current executor!')
    }

    const results = await Promise.all((operation.guardians || []).map(x => x(context, params)))
    if (finishTransaction) {
      await finishTransaction()
    }
    return results.filter(x => x) as GuardianValidationError[]
  }

  registerMiddleware = (middleware: ExecutionMiddleware<TContext, any, any>) => {
    this.middlewares.push(middleware)
    return () => {
      this.middlewares = this.middlewares.filter(x => x !== middleware)
    }
  }

  execute = async <TParams, TResult>(operation: IOperation<TContext, TParams, TResult>, params: TParams): Promise<TResult> => {
    let abortTransaction: (() => Promise<any>) | undefined = undefined
    let finishTransaction: (() => Promise<any>) | undefined = undefined
    let context: any
    try {
      if (this.context) {
        context = this.context
      } else {
        if (!this.beginTransaction) {
          throw new Error('Unable to execute operation! Transaction generator has not passed to constructor of current executor!')
        }
        const transaction = this.beginTransaction()
        abortTransaction = transaction.abortTransaction
        finishTransaction = transaction.finishTransaction
        context = transaction.context
      }

      const validationResult = await this.validate(operation, params, context)
      if (validationResult.length) {
        throw new OperationExecutionError({ kind: 'failedValidation', validationErrors: validationResult })
      }

      const execute = this.middlewares.reduce(
        (result, middleware) => {
          return () => {
            return middleware(
              async () => {
                return await result()
              },
              context,
              params
            )
          }
        },
        () => operation.handler(context, params, OperationExecutor.createWithLockedContext(context))
      )

      const result = await execute()
      if (finishTransaction) {
        await finishTransaction()
      }
      return result
    } catch (e) {
      try {
        if (abortTransaction) {
          await abortTransaction()
        }
      } catch (e) {}

      if (e instanceof OperationExecutionError) {
        throw e
      } else {
        throw new OperationExecutionError({ kind: 'exceptionDuringExecution', exception: e })
      }
    }
  }

  static create = <TContext>(beginTransaction: ExecutorTransactionFactory<TContext>): IOperationExecutor<TContext> => {
    return new OperationExecutor<TContext>(beginTransaction)
  }

  static createWithLockedContext = <TContext>(context: TContext): IOperationExecutor<TContext> => {
    return new OperationExecutor<TContext>(context)
  }
}
