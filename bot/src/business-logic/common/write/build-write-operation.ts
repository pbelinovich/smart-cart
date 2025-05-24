import { IWriteOperationContext } from '../../types'
import { createOperationBuilder } from '@shared'

export const buildWriteOperation = createOperationBuilder<IWriteOperationContext>()
