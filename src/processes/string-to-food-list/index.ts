import { ProductParser } from './core'
import { MistralAdapter } from './model'
import { DefaultPromptBuilder } from './promt'

export const stringToFoodList = () => (entry: string) => {
  const parser = new ProductParser(new MistralAdapter(), new DefaultPromptBuilder())
  return parser.parse(entry.trim())
}
