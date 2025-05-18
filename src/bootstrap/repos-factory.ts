import {
  UserRepo,
  DataBaseSession,
  MemorySession,
  AIProductsListRepo,
  MarketplaceProductsRepo,
  ProductRepo,
  ProductsRequestRepo,
} from './external'

export class ReposFactory {
  constructor(private _dbSession: DataBaseSession, private _memorySession: MemorySession) {}

  private _aiProductsListRepo: AIProductsListRepo | undefined
  private _marketplaceProductRepo: MarketplaceProductsRepo | undefined
  private _productRepo: ProductRepo | undefined
  private _productsRequestRepo: ProductsRequestRepo | undefined
  private _user: UserRepo | undefined

  get aiProductsListRepo() {
    if (!this._aiProductsListRepo) {
      this._aiProductsListRepo = new AIProductsListRepo(this._dbSession)
    }

    return this._aiProductsListRepo!
  }

  get marketplaceProductRepo() {
    if (!this._marketplaceProductRepo) {
      this._marketplaceProductRepo = new MarketplaceProductsRepo(this._dbSession)
    }

    return this._marketplaceProductRepo!
  }

  get productRepo() {
    if (!this._productRepo) {
      this._productRepo = new ProductRepo(this._dbSession)
    }

    return this._productRepo!
  }

  get productsRequestRepo() {
    if (!this._productsRequestRepo) {
      this._productsRequestRepo = new ProductsRequestRepo(this._dbSession)
    }

    return this._productsRequestRepo!
  }

  get userRepo() {
    if (!this._user) {
      this._user = new UserRepo(this._dbSession)
    }

    return this._user!
  }
}
