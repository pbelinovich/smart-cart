import { IModelAdapter, IPromptBuilder } from '../types'
import { productListSchema } from '../common'
import { logInfo, IAIProduct } from '../../external'

export class ProductParser {
  constructor(private model: IModelAdapter, private promptBuilder: IPromptBuilder) {}

  parse = async (input: string) => {
    const prompt = this.promptBuilder.buildPrompt(input)
    const output = await this.model.generate(prompt)

    try {
      const parsed = JSON.parse(output) as IAIProduct[]
      const validationResult = productListSchema.validate(parsed, { abortEarly: true })

      if (validationResult.error) {
        const errorMessage = validationResult.error.details.map(error => error.message).join(', ')
        throw new Error(`Validation error: ${errorMessage}`)
      }

      return parsed
    } catch (e) {
      logInfo('Failed to parse model output:', output)
      throw new Error('Model returned invalid JSON')
    }
  }
}
