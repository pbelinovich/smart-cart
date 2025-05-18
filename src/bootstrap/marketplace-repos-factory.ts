import { EdadealRepo } from './external'

export class MarketplaceReposFactory {
  private _edadealRepo: EdadealRepo | undefined

  get edadealRepo() {
    if (!this._edadealRepo) {
      this._edadealRepo = new EdadealRepo()
    }

    return this._edadealRepo!
  }
}
