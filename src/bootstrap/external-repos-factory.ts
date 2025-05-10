import { IgooodsMarketplaceRepo } from './external'

export class ExternalReposFactory {
  private _igooodsMarketplaceRepo: IgooodsMarketplaceRepo | undefined

  get igooodsMarketplaceRepo() {
    if (!this._igooodsMarketplaceRepo) {
      this._igooodsMarketplaceRepo = new IgooodsMarketplaceRepo()
    }

    return this._igooodsMarketplaceRepo!
  }
}
