import { buildProcessHandler } from '../../common'
import {
  getProductsRequestById,
  ICollectProductsParams,
  getUserById,
  getPresentProductsByHashes,
  getCityById,
  getShopsList,
  IPresentProductEntity,
  createProduct,
  IEdadealProduct,
  createPresentProduct,
  IEdadealGetProductsResponse,
  searchEdadealProducts,
  EdadealPriceValue,
  generateProductHash,
  getAbsentProductsByHashes,
  IAbsentProductEntity,
  removePresentProduct,
  removeAbsentProduct,
  createAbsentProduct,
} from '../../external'
import { createProductsResponse } from '../../../bussines-logic/internal/products-response'

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

export const collectProducts = buildProcessHandler(async ({ readExecutor, writeExecutor }, params: ICollectProductsParams) => {
  const productsRequest = await readExecutor.execute(getProductsRequestById, { id: params.productsRequestId })

  if (!productsRequest || productsRequest.status !== 'productsCollecting') {
    return false
  }

  const user = await readExecutor.execute(getUserById, { id: productsRequest.userId })
  const city = await readExecutor.execute(getCityById, { id: user.actualCityId })

  if (!city) {
    return false
  }

  const shops = await readExecutor.execute(getShopsList, {})
  const shopMarketplaceIdToHashMap = shops.reduce<{ [shopId: string]: string }>((acc, shop) => {
    acc[shop.marketplaceId] = generateProductHash(city.id, shop.id, params.product.name, params.product.priceCategory)
    return acc
  }, {})

  const shopsHashes = shops.map(shop => shopMarketplaceIdToHashMap[shop.marketplaceId])
  const [presentProducts, absentProducts] = await Promise.all([
    readExecutor.execute(getPresentProductsByHashes, { hashes: shopsHashes }),
    readExecutor.execute(getAbsentProductsByHashes, { hashes: shopsHashes }),
  ])

  const presentProductsMap = presentProducts.reduce<{ [x: string]: IPresentProductEntity }>((acc, x) => {
    acc[x.hash] = x
    return acc
  }, {})

  const absentProductsMap = absentProducts.reduce<{ [x: string]: IAbsentProductEntity }>((acc, x) => {
    acc[x.hash] = x
    return acc
  }, {})

  const everyProductIsCached = shops.every(shop => {
    const hash = shopMarketplaceIdToHashMap[shop.marketplaceId]
    return presentProductsMap[hash] || absentProductsMap[hash]
  })

  const presentProductsCreationPromises: (() => Promise<void>)[] = []
  const absentProductsCreationPromises: (() => Promise<void>)[] = []

  if (!everyProductIsCached) {
    let response: IEdadealGetProductsResponse | undefined

    try {
      response = await readExecutor.execute(searchEdadealProducts, {
        coordinates: city.coordinates,
        shopIds: Object.keys(shopMarketplaceIdToHashMap),
        text: params.product.name,
      })

      await writeExecutor.execute(createProductsResponse, {
        productsRequestId: productsRequest.id,
        data: response,
      })
    } catch (e) {
      await writeExecutor.execute(createProductsResponse, {
        productsRequestId: productsRequest.id,
        data: 'errorWhileFetching',
      })

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
          shopToItemsMap[shop.marketplaceId] = items.sort((a, b) => {
            const priceA = getPrice(a)
            const priceB = getPrice(b)

            if (priceA === 0) {
              return 1
            } else if (priceB === 0) {
              return -1
            }

            return params.product.priceCategory === 'cheapest' ? priceA - priceB : priceB - priceA
          })
        }
      })
    }

    shops.forEach(shop => {
      const shopItem = shopToItemsMap[shop.marketplaceId]
      const hash = shopMarketplaceIdToHashMap[shop.marketplaceId]
      const price = shopItem && shopItem[0] ? getPrice(shopItem[0]) : 0

      if (shopItem && shopItem[0] && price > 0) {
        const prevPresentProduct = presentProductsMap[hash]

        presentProductsCreationPromises.push(async () => {
          if (prevPresentProduct) {
            await writeExecutor.execute(removePresentProduct, { id: prevPresentProduct.id })
          }

          await writeExecutor.execute(createPresentProduct, {
            cityId: city.id,
            shopId: shop.id,
            queryName: params.product.name,
            productName: shopItem[0].title || '',
            productPrice: price,
            hash,
          })
        })
      } else {
        const prevAbsentProduct = absentProductsMap[hash]

        absentProductsCreationPromises.push(async () => {
          if (prevAbsentProduct) {
            await writeExecutor.execute(removeAbsentProduct, { id: prevAbsentProduct.id })
          }

          await writeExecutor.execute(createAbsentProduct, {
            cityId: city.id,
            shopId: shop.id,
            queryName: params.product.name,
            hash,
          })
        })
      }
    })
  }

  await Promise.all([
    ...presentProductsCreationPromises.map(x => x()),
    ...absentProductsCreationPromises.map(x => x()),
    ...shops.map(shop => {
      return writeExecutor.execute(createProduct, {
        productsRequestId: params.productsRequestId,
        cachedProductHash: shopMarketplaceIdToHashMap[shop.marketplaceId],
        quantity: params.product.quantity,
      })
    }),
  ])

  return true
})
