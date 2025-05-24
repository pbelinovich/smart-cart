import { AIRepo } from '../common/ai-repo'
import { MistralAdapter } from './mistral-adapter'
import { DefaultPromptBuilder } from '../common'

export class MistralRepo extends AIRepo {
  constructor() {
    super(new MistralAdapter(), new DefaultPromptBuilder())
  }
}
