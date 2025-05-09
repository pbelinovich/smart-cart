import { IModelAdapter } from '../types'

export class MistralAdapter implements IModelAdapter {
  generate = async (prompt: string) => {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        prompt,
        stream: false,
      }),
    })

    const json = await response.json()

    return json.response
  }
}
