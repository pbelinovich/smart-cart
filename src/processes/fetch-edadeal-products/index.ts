import {
  getProductsRequestById,
  IApp,
  IFetchEdadealProductsParams,
  MarketplaceProductsRepo,
  getUserById,
  getMarketplaceProductsByHashes,
  getCityById,
  getShopsList,
  IShop,
  IMarketplaceProductEntity,
  createProduct,
  IEdadealProduct,
  createMarketplaceProduct,
} from '../external'

export const fetchEdadealProducts = (appInstance: IApp) => {
  const { readExecutor, writeExecutor } = appInstance.getExecutors({})

  return async (params: IFetchEdadealProductsParams) => {
    const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

    if (!productsRequest || productsRequest.status !== 'created') {
      return
    }

    const user = await readExecutor.execute(getUserById, { id: productsRequest.userId })
    const city = await readExecutor.execute(getCityById, { id: user.actualCityId })

    if (!city) {
      return
    }

    const shops = await readExecutor.execute(getShopsList, {})
    const shopsMap = shops.reduce<{ [shopId: string]: { hash: string; shop: IShop } }>((acc, shop) => {
      acc[shop.id] = {
        hash: MarketplaceProductsRepo.generateHash(city.id, shop.id, params.product.name, params.product.priceCategory),
        shop,
      }

      return acc
    }, {})

    const marketplaceProducts = await readExecutor.execute(getMarketplaceProductsByHashes, {
      hashes: shops.map(shop => shopsMap[shop.id].hash),
    })

    const marketplaceProductsMap = marketplaceProducts.reduce<{ [x: string]: IMarketplaceProductEntity }>((acc, x) => {
      acc[x.hash] = x
      return acc
    }, {})

    const marketplaceProductsCreationPromises: Promise<IMarketplaceProductEntity>[] = []

    if (shops.some(shop => !marketplaceProductsMap[shopsMap[shop.id].hash])) {
      const response = await appInstance.marketplaces.edadealRepo.search({
        city,
        shopIds: Object.keys(shopsMap),
        text: params.product.name,
      })

      const shopToItemsMap = response.items.reduce<{ [shopId: string]: IEdadealProduct[] }>((acc, item) => {
        if (!acc[item.partner.uuid]) {
          acc[item.partner.uuid] = []
        }

        acc[item.partner.uuid].push(item)
        return acc
      }, {})

      if (params.product.priceCategory === 'cheapest' || params.product.priceCategory === 'mostExpensive') {
        shops.forEach(shop => {
          const items = shopToItemsMap[shop.id]

          if (items) {
            shopToItemsMap[shop.id] = items.sort((a, b) => {
              const priceA = a.priceForUnit?.price?.value?.value
              const priceB = b.priceForUnit?.price?.value?.value

              return params.product.priceCategory === 'cheapest' ? priceA - priceB : priceB - priceA
            })
          }
        })
      }

      shops.forEach(shop => {
        const shopMapItem = shopsMap[shop.id]
        const shopItem = shopToItemsMap[shop.id]

        // TODO если нет shopItem, то добавить запись об отсутствии
        if (!marketplaceProductsMap[shopMapItem.hash] && shopItem && shopItem[0]) {
          marketplaceProductsCreationPromises.push(
            writeExecutor.execute(createMarketplaceProduct, {
              cityId: city.id,
              shopId: shop.id,
              queryName: params.product.name,
              productName: shopItem[0].title || '',
              productPrice: shopItem[0].priceForUnit?.price?.value?.value || 0,
              hash: shopMapItem.hash,
            })
          )
        }
      })
    }

    await Promise.all([
      ...marketplaceProductsCreationPromises,
      ...shops.map(shop => {
        return writeExecutor.execute(createProduct, {
          productsRequestId: params.productsRequestId,
          marketplaceProductHash: shopsMap[shop.id].hash,
          quantity: params.product.quantity,
        })
      }),
    ])

    return true
  }
}
