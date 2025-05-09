export interface IModelAdapter {
  generate: (prompt: string) => Promise<string>
}

export interface IPromptBuilder {
  buildPrompt: (input: string) => string
}

export type PriceCategory = 'cheapest' | 'popular' | 'mostExpensive'

export interface IProduct {
  product: string
  quantity: number
  priceCategory: PriceCategory
}
