import axios from 'axios'
import { IModelAdapter } from '../types'

const OLLAMA_API_URL = 'http://127.0.0.1:11434/api/generate'

export class MistralAdapter implements IModelAdapter {
  generate = async (prompt: string) => {
    const result = await axios.post(
      OLLAMA_API_URL,
      { model: 'mistral', prompt, stream: false },
      { headers: { 'Content-Type': 'application/json' } }
    )

    return result.data.response
  }
}
