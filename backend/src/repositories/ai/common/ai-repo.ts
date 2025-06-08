import { IAIProduct, IRawAIProduct } from '../../types'
import { logInfo } from '../../external'
import { productsListSchema } from './helpers'
import { IModelAdapter, IPromptBuilder } from './types'

interface INormalizer {
  normalize: (input: string) => string
}

class SeparatorNormalizer implements INormalizer {
  constructor(private readonly pattern: RegExp, private readonly replacement: string) {}

  normalize = (input: string): string => {
    return input.replace(this.pattern, this.replacement)
  }
}

class InputNormalizer {
  private readonly normalizers: INormalizer[] = [
    new SeparatorNormalizer(/\s+/g, ' '), // multiple spaces
    new SeparatorNormalizer(/,+/g, ','), // multiple commas
    new SeparatorNormalizer(/\.+/g, '.'), // multiple dots
    new SeparatorNormalizer(/\n+/g, '\n'), // multiple newlines
    new SeparatorNormalizer(/\t+/g, ' '), // multiple tabs
    new SeparatorNormalizer(/\s*,\s*/g, ', '), // spaces around commas
    new SeparatorNormalizer(/\s*\.\s*/g, '. '), // spaces around dots
    new SeparatorNormalizer(/\s*\n\s*/g, '\n'), // spaces around newlines
  ]

  normalize = (input: string): string => {
    const result = this.normalizers.reduce((acc: string, normalizer: INormalizer) => normalizer.normalize(acc), input)
    return result.trim()
  }
}

export abstract class AIRepo {
  private readonly inputNormalizer = new InputNormalizer()

  protected constructor(private readonly model: IModelAdapter, private readonly promptBuilder: IPromptBuilder) {}

  private convertRawToAIProduct = (rawProduct: IRawAIProduct): IAIProduct => {
    return {
      name: rawProduct.name,
      quantity: parseInt(rawProduct.quantity, 10),
      priceCategory: rawProduct.priceCategory,
    }
  }

  private tryParse = async (input: string) => {
    const normalizedInput = this.inputNormalizer.normalize(input)
    const prompt = this.promptBuilder.buildPrompt(normalizedInput)
    const output = await this.model.generate(prompt)

    try {
      const parsedRawProducts = JSON.parse(output) as IRawAIProduct[]
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
