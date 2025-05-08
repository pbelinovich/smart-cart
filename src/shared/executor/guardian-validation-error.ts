export class GuardianValidationError extends Error {}

export type OperationExecutionErrorInfo =
  | { kind: 'failedValidation'; validationErrors: GuardianValidationError[] }
  | { kind: 'exceptionDuringExecution'; exception: any }

export class OperationExecutionError extends Error {
  constructor(public info: OperationExecutionErrorInfo) {
    let message =
      info.kind === 'failedValidation' ? `Validation operation error: ${info.validationErrors.map(x => x.message).join(', ')}` : ''
    if (info.kind === 'exceptionDuringExecution') {
      if (info.exception instanceof Error) {
        message = info.exception.message
      } else {
        message = `Operation execution error: ${JSON.stringify(info.exception)}`
      }
    }
    super(message)
    if (info.kind === 'exceptionDuringExecution' && info.exception instanceof Error) {
      this.stack = info.exception.stack
    }
  }
}
