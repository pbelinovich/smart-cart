export interface IModelAdapter {
  generate: (prompt: string) => Promise<string>
}

export interface IPromptBuilder {
  buildPrompt: (input: string) => string
}
