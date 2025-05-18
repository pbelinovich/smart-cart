import joi from 'joi'
import { buildPublicHandler } from '../builder'
import {
  createAuth,
  createUserAddress,
  getAuthByUserId,
  getUserAddressById,
  getUserById,
  IAIProduct,
  Marketplace,
  updateAuth,
  updateUser,
} from '../../../external'

export interface IGetCartsParams {
  userId: string
  query: string
  marketplace: Marketplace
}

const marketplaces: { [key in Marketplace]: true } = {
  igooods: true,
}

const schema = joi.object<IGetCartsParams>({
  userId: joi.string().required(),
  query: joi.string().required(),
  marketplace: joi
    .string()
    .valid(...Object.keys(marketplaces))
    .required(),
})

export const getCarts = buildPublicHandler(schema, async (params, { process, readExecutor, writeExecutor, external }) => {
  /* const marketplaceRepo = external.igooodsMarketplaceRepo

  let user = await readExecutor.execute(getUserById, { id: params.userId })
  let userAddress

  if (!user.actualUserAddressId) {
    userAddress = await writeExecutor.execute(createUserAddress, {
      userId: user.id,
      country: 'Russia',
      region: 'Moscow',
      city: 'Moscow',
      street: 'Asd',
      apartment: '10',
      coordinates: {
        latitude: 30.3123585,
        longitude: 59.9595541,
      },
    })

    user = await writeExecutor.execute(updateUser, { id: user.id, actualUserAddressId: userAddress.id })
  } else {
    userAddress = await readExecutor.execute(getUserAddressById, { id: user.actualUserAddressId! })
  }

  let auth = await readExecutor.execute(getAuthByUserId, { userId: user.id, marketplace: params.marketplace })

  console.log('!!auth', auth)

  // if (!auth) {
  const authData = await marketplaceRepo.getAuthData()

  if (!authData) {
    throw new Error(`Cannot authorize on ${params.marketplace} marketplace`)
  }

  if (auth) {
    auth = await writeExecutor.execute(updateAuth, {
      id: auth.id,
      userId: user.id,
      marketplace: params.marketplace,
      authData,
    })
  } else {
    auth = await writeExecutor.execute(createAuth, {
      userId: user.id,
      marketplace: params.marketplace,
      authData,
    })
  }

  console.log('!!auth2', auth)
  // }

  //  const userProducts = await process.request<IUserProduct[]>('parseProducts', params.query)

  // console.log('!!userProducts', userProducts)

  return marketplaceRepo.getCarts({
    auth,
    userAddress,
    userProducts: [{ name: 'молоко', quantity: 1, priceCategory: 'popular' }],
  }) */
})
