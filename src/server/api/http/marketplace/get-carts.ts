import joi from 'joi'
import { buildPublicHandler } from '../builder'
import {
  createAuth,
  createUserAddress,
  getAuthByUserId,
  getUserAddressById,
  getUserById,
  IUserProduct,
  Marketplace,
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
  const marketplaceRepo = external.igooodsMarketplaceRepo

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
        latitude: 55.7558,
        longitude: 37.6173,
      },
    })

    user = await writeExecutor.execute(updateUser, { id: user.id, actualUserAddressId: userAddress.id })
  } else {
    userAddress = await readExecutor.execute(getUserAddressById, { id: user.actualUserAddressId! })
  }

  let auth = await readExecutor.execute(getAuthByUserId, { userId: user.id, marketplace: params.marketplace })

  console.log('!!auth', auth)

  if (!auth) {
    // const authData = await marketplaceRepo.getAuthData()
    const authData = {
      id: 347548450,
      token: 'EPn2s9qdzYz_SCNCvnMX',
    }

    if (!authData) {
      throw new Error(`Cannot authorize on ${params.marketplace} marketplace`)
    }

    auth = await writeExecutor.execute(createAuth, {
      userId: user.id,
      marketplace: params.marketplace,
      authData,
    })

    console.log('!!auth2', auth)
  }

  const userProducts = await process.request<IUserProduct[]>('parseProducts', params.query)

  console.log('!!userProducts', userProducts)

  return marketplaceRepo.getCarts({ auth, userAddress, userProducts })
})
