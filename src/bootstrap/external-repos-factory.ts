import { EdadealMarketplaceRepo, IgooodsMarketplaceRepo } from './external'

export class ExternalReposFactory {
  private _edadealMarketplaceRepo: EdadealMarketplaceRepo | undefined
  private _igooodsMarketplaceRepo: IgooodsMarketplaceRepo | undefined

  get edadealMarketplaceRepo() {
    if (!this._edadealMarketplaceRepo) {
      this._edadealMarketplaceRepo = new EdadealMarketplaceRepo()
    }

    return this._edadealMarketplaceRepo!
  }

  get igooodsMarketplaceRepo() {
    if (!this._igooodsMarketplaceRepo) {
      this._igooodsMarketplaceRepo = new IgooodsMarketplaceRepo()
    }

    return this._igooodsMarketplaceRepo!
  }
}
