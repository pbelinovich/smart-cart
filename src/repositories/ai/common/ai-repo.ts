import { IAIProduct } from '../../types'
import { logInfo } from '../../external'
import { productsListSchema } from './helpers'
import { IModelAdapter, IPromptBuilder } from './types'

export abstract class AIRepo {
  protected constructor(private readonly model: IModelAdapter, private readonly promptBuilder: IPromptBuilder) {}

  parse = async (input: string) => {
    const prompt = this.promptBuilder.buildPrompt(input)
    const output = await this.model.generate(prompt)

    try {
      const parsed = JSON.parse(output) as IAIProduct[]
      const validationResult = productsListSchema.validate(parsed, { abortEarly: true })

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
