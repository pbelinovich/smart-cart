import { asd } from './some/tools'
import { someFunc } from './external'

export * from './external'
export * from './some/tools'

export const zzz1 = asd({ qwe: someFunc('qwe') })
