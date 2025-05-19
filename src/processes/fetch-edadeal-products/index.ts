import { buildProcessHandler } from '../common'
import {
  getProductsRequestById,
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
  IEdadealGetProductsResponse,
  searchEdadealProducts,
  EdadealPriceValue,
} from '../external'

const getPriceFromPriceValue = (priceValue?: EdadealPriceValue) => {
  if (priceValue) {
    if (priceValue.type === 'value') {
      return priceValue.value
    }

    if (priceValue.type === 'range') {
      return priceValue.from
    }
  }

  return 0
}

const getPrice = (edadealProduct: IEdadealProduct) => {
  return getPriceFromPriceValue(edadealProduct.priceData?.new) || getPriceFromPriceValue(edadealProduct.priceForUnit?.price?.value)
}

export const fetchEdadealProducts = buildProcessHandler(async ({ readExecutor, writeExecutor }, params: IFetchEdadealProductsParams) => {
  const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest || productsRequest.status !== 'created') {
    return true
  }

  const user = await readExecutor.execute(getUserById, { id: productsRequest.userId })
  const city = await readExecutor.execute(getCityById, { id: user.actualCityId })

  if (!city) {
    return false
  }

  const shops = await readExecutor.execute(getShopsList, {})
  const shopsMap = shops.reduce<{ [shopId: string]: { hash: string; shop: IShop } }>((acc, shop) => {
    acc[shop.marketplaceId] = {
      hash: MarketplaceProductsRepo.generateHash(city.id, shop.id, params.product.name, params.product.priceCategory),
      shop,
    }

    return acc
  }, {})

  const marketplaceProducts = await readExecutor.execute(getMarketplaceProductsByHashes, {
    hashes: shops.map(shop => shopsMap[shop.marketplaceId].hash),
  })

  const marketplaceProductsMap = marketplaceProducts.reduce<{ [x: string]: IMarketplaceProductEntity }>((acc, x) => {
    acc[x.hash] = x
    return acc
  }, {})

  const marketplaceProductsCreationPromises: Promise<IMarketplaceProductEntity>[] = []

  if (shops.some(shop => !marketplaceProductsMap[shopsMap[shop.marketplaceId].hash])) {
    let response: IEdadealGetProductsResponse | undefined

    try {
      response = await readExecutor.execute(searchEdadealProducts, {
        coordinates: city.coordinates,
        shopIds: Object.keys(shopsMap),
        text: params.product.name,
      })
    } catch (e) {
      return false
    }

    const shopToItemsMap = (response?.items || []).reduce<{ [shopId: string]: IEdadealProduct[] }>((acc, item) => {
      if (!acc[item.partner.uuid]) {
        acc[item.partner.uuid] = []
      }

      acc[item.partner.uuid].push(item)
      return acc
    }, {})

    if (params.product.priceCategory === 'cheapest' || params.product.priceCategory === 'mostExpensive') {
      shops.forEach(shop => {
        const items = shopToItemsMap[shop.marketplaceId]

        if (items) {
          shopToItemsMap[shop.id] = items.sort((a, b) => {
            const priceA = getPrice(a)
            const priceB = getPrice(b)

            return params.product.priceCategory === 'cheapest' ? priceA - priceB : priceB - priceA
          })
        }
      })
    }

    shops.forEach(shop => {
      const shopMapItem = shopsMap[shop.marketplaceId]
      const shopItem = shopToItemsMap[shop.marketplaceId]

      // TODO если нет shopItem, то добавить запись об отсутствии
      if (!marketplaceProductsMap[shopMapItem.hash] && shopItem && shopItem[0]) {
        marketplaceProductsCreationPromises.push(
          writeExecutor.execute(createMarketplaceProduct, {
            cityId: city.id,
            shopId: shop.id,
            queryName: params.product.name,
            productName: shopItem[0].title || '',
            productPrice: getPrice(shopItem[0]),
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
        marketplaceProductHash: shopsMap[shop.marketplaceId].hash,
        quantity: params.product.quantity,
      })
    }),
  ])

  return true
})
