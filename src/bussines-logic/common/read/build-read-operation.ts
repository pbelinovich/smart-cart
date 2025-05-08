import { IReadOperationContext } from '../../types'
import { createOperationBuilder } from '@shared'

export const buildReadOperation = createOperationBuilder<IReadOperationContext>()
