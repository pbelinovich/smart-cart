export interface IProduct {
  product: string
  quantity: number
  price: number
}

export interface ICart {
  shopId: string
  shopName: string
  products: IProduct[]
  totalPrice: number
}

export interface IMarketplace {
  getCarts: () => Promise<ICart[]>
}
