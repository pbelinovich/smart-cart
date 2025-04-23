import { asd } from './some/tools'
import { someFunc } from './external'

export * from './external'
export * from './some/tools'

export const zzz = asd({ qwe: someFunc('qwe') })
