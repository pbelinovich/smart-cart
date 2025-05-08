import { createOperationBuilder } from '../../external'
import { IWriteOperationContext } from '../../types'

export const buildWriteOperation = createOperationBuilder<IWriteOperationContext>()
