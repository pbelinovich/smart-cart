import { Schema } from 'joi'
import { IDataValidator } from './types'
import { logWarning } from '../logger'

export class DataValidator<T, TSchema extends Schema> implements IDataValidator<T> {
  Type!: T

  constructor(private readonly schema: TSchema) {}

  validate = (data: any) => {
    const result = this.schema.validate(data)

    if (result.warning) {
      logWarning(result.warning.message)
    }

    return result.error?.message
  }
}
