import {
  UserRepo,
  DataBaseSession,
  MemorySession,
  PresentProductRepo,
  ProductsRequestRepo,
  AbsentProductRepo,
  ProductsResponseRepo,
} from './external'

export class ReposFactory {
  constructor(private _dbSession: DataBaseSession, private _memorySession: MemorySession) {}

  private _absentProductRepo: AbsentProductRepo | undefined
  private _presentProductRepo: PresentProductRepo | undefined
  private _productsRequestRepo: ProductsRequestRepo | undefined
  private _productsResponseRepo: ProductsResponseRepo | undefined
  private _user: UserRepo | undefined

  get absentProductRepo() {
    if (!this._absentProductRepo) {
      this._absentProductRepo = new AbsentProductRepo(this._dbSession)
    }

    return this._absentProductRepo!
  }

  get presentProductRepo() {
    if (!this._presentProductRepo) {
      this._presentProductRepo = new PresentProductRepo(this._dbSession)
    }

    return this._presentProductRepo!
  }

  get productsRequestRepo() {
    if (!this._productsRequestRepo) {
      this._productsRequestRepo = new ProductsRequestRepo(this._dbSession)
    }

    return this._productsRequestRepo!
  }

  get productsResponseRepo() {
    if (!this._productsResponseRepo) {
      this._productsResponseRepo = new ProductsResponseRepo(this._dbSession)
    }

    return this._productsResponseRepo!
  }

  get userRepo() {
    if (!this._user) {
      this._user = new UserRepo(this._dbSession)
    }

    return this._user!
  }
}
