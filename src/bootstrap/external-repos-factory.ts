import { MistralRepo, EdadealRepo } from './external'

export class ExternalReposFactory {
  constructor(private readonly proxy?: string) {}

  private _mistralRepo: MistralRepo | undefined
  private _edadealRepo: EdadealRepo | undefined

  get mistralRepo() {
    if (!this._mistralRepo) {
      this._mistralRepo = new MistralRepo()
    }

    return this._mistralRepo!
  }

  get edadealRepo() {
    if (!this._edadealRepo) {
      this._edadealRepo = new EdadealRepo(this.proxy)
    }

    return this._edadealRepo!
  }
}
