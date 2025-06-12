import { IPromptBuilder } from './types'
import * as fs from 'node:fs'
import * as path from 'node:path'

export class DefaultPromptBuilder implements IPromptBuilder {
  private prompt: string

  constructor() {
    // Загружаем промпт из JSON файла
    const promptPath = path.join(process.cwd(), 'src', 'shared', 'parse-products.json')
    try {
      const data = JSON.parse(fs.readFileSync(promptPath, 'utf-8'))
      this.prompt = data.prompt
    } catch (error) {
      throw new Error(`Failed to load prompt from ${promptPath}: ${error}`)
    }
  }

  buildPrompt = (input: string) => {
    return `${this.prompt}${input}`.trim()
  }
}
