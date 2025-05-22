import { IAIProduct, IRawAIProduct } from '../../types'
import { logInfo } from '../../external'
import { productsListSchema } from './helpers'
import { IModelAdapter, IPromptBuilder } from './types'

export abstract class AIRepo {
  protected constructor(private readonly model: IModelAdapter, private readonly promptBuilder: IPromptBuilder) {}

  private convertRawToAIProduct = (rawProduct: IRawAIProduct): IAIProduct => {
    return {
      name: rawProduct.name,
      quantity: parseInt(rawProduct.quantity, 10),
      priceCategory: rawProduct.priceCategory,
    }
  }

  private tryParse = async (input: string) => {
    const prompt = this.promptBuilder.buildPrompt(input)
    const output = await this.model.generate(prompt)
    const preparedOutput = output.replace(/\s+/g, ' ')

    try {
      const parsedRawProducts = JSON.parse(preparedOutput) as IRawAIProduct[]
      const validationResult = productsListSchema.validate(parsedRawProducts, { abortEarly: true })

      if (validationResult.error) {
        const errorMessage = validationResult.error.details.map(error => error.message).join(', ')
        throw new Error(`Validation error: ${errorMessage}`)
      }

      return parsedRawProducts.map(raw => this.convertRawToAIProduct(raw))
    } catch (e: any) {
      throw new Error(`Model returned invalid JSON. ${e.message}`)
    }
  }

  parse = async (input: string): Promise<IAIProduct[]> => {
    let tryCounter = 0
    let result: IAIProduct[] = []

    // пытаемся получить валидные данные от нейронки 3 раза
    while (tryCounter < 3) {
      try {
        result = await this.tryParse(input)
        break
      } catch (e: any) {
        if (tryCounter === 2) {
          logInfo(`Failed to parse model output. ${e.message}`)
          throw e
        }

        tryCounter += 1
      }
    }

    return result
  }
}
