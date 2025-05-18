import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { getUserById, IAIProduct } from '../../../external'

export interface IGetCartsParams {
  userId: string
  query: string
}

const schema = joi.object<IGetCartsParams>({
  userId: joi.string().required(),
  query: joi.string().required(),
})

const userProducts: IAIProduct[] = [
  { name: 'Сметана', quantity: '1', priceCategory: 'mostExpensive' },
  { name: 'Батон', quantity: '1', priceCategory: 'mostExpensive' },
  {
    name: 'молоко',
    quantity: '1',
    priceCategory: 'popular',
  },
  { name: 'туалетная бумага zewa', quantity: '1', priceCategory: 'cheapest' },
  {
    name: 'яйца',
    quantity: '6',
    priceCategory: 'popular',
  },
  {
    name: 'сыр',
    quantity: '1',
    priceCategory: 'popular',
  },
  {
    name: 'чипсы',
    quantity: '1',
    priceCategory: 'popular',
  },
  { name: 'картошка 1кг', quantity: '1', priceCategory: 'cheapest' },
  {
    name: 'йогурт',
    quantity: '1',
    priceCategory: 'popular',
  },
]

export const getCarts = buildPublicHandler(schema, async (params, { process, readExecutor, writeExecutor, external }) => {
  const user = await readExecutor.execute(getUserById, { id: params.userId })
  // const cartsRequest = await writeExecutor.execute(createCartsRequest, { userId: user.id, query: params.query })
  // const userProducts = await process.request<IUserProduct[]>('parseProducts', params.query)

  // console.log('!!userProducts', JSON.stringify(userProducts))

  if (!userProducts.length) {
    return []
  }

  // await writeExecutor.execute(createAiProducts, { cartsRequestId: cartsRequest.id, userProducts })

  // const { carts, responses } = await external.edadealMarketplaceRepo.getCarts({ userProducts })

  await Promise.all([
    // writeExecutor.execute(createCarts, { cartsRequestId: cartsRequest.id, carts }),
    // writeExecutor.execute(createEdadealResponses, { cartsRequestId: cartsRequest.id, responses }),
  ])

  // return carts
})
