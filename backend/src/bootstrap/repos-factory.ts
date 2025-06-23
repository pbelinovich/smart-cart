import {
  UserRepo,
  DataBaseSession,
  MemorySession,
  PresentProductRepo,
  ProductsRequestRepo,
  AbsentProductRepo,
  ProductsResponseRepo,
  CityRepo,
  ChangeCityRequestRepo,
  CartRepo,
  CartProductInStockHashRepo,
} from './external'

export class ReposFactory {
  constructor(private _dbSession: DataBaseSession, private _memorySession: MemorySession) {}

  private _absentProductRepo: AbsentProductRepo | undefined
  private _cartProductInStockHashRepo: CartProductInStockHashRepo | undefined
  private _cartRepo: CartRepo | undefined
  private _changeCityRequestRepo: ChangeCityRequestRepo | undefined
  private _cityRepo: CityRepo | undefined
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

  get cartProductInStockHashRepo() {
    if (!this._cartProductInStockHashRepo) {
      this._cartProductInStockHashRepo = new CartProductInStockHashRepo(this._dbSession)
    }

    return this._cartProductInStockHashRepo!
  }

  get cartRepo() {
    if (!this._cartRepo) {
      this._cartRepo = new CartRepo(this._dbSession)
    }

    return this._cartRepo!
  }

  get changeCityRequestRepo() {
    if (!this._changeCityRequestRepo) {
      this._changeCityRequestRepo = new ChangeCityRequestRepo(this._dbSession)
    }

    return this._changeCityRequestRepo!
  }

  get cityRepo() {
    if (!this._cityRepo) {
      this._cityRepo = new CityRepo(this._dbSession)
    }

    return this._cityRepo!
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
