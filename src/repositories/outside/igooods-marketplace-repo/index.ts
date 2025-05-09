import { IMarketplace } from '../types'

export class IgooodsMarketplaceRepo implements IMarketplace {
  getCarts = () => {
    return Promise.resolve([
      {
        shopId: '123123',
        shopName: 'Лента',
        products: [
          {
            product: 'apple',
            quantity: 1,
            price: 1.5,
          },
          {
            product: 'banana',
            quantity: 2,
            price: 0.5,
          },
        ],
        totalPrice: 2.5,
      },
    ])
  }
}
