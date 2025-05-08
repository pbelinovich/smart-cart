import { createOperationBuilder } from '../../external'
import { IReadOperationContext } from '../../types'

export const buildReadOperation = createOperationBuilder<IReadOperationContext>()
