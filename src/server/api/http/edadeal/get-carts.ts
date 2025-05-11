import joi from 'joi'
import { buildPublicHandler } from '../builder'
import { getUserById, IUserAddressEntity, IUserProduct } from '../../../external'

export interface IGetCartsParams {
  userId: string
  query: string
}

const schema = joi.object<IGetCartsParams>({
  userId: joi.string().required(),
  query: joi.string().required(),
})

export const getCarts = buildPublicHandler(schema, async (params, { process, readExecutor, external }) => {
  const marketplaceRepo = external.edadealMarketplaceRepo
  const user = await readExecutor.execute(getUserById, { id: params.userId })

  let userAddress: IUserAddressEntity | undefined

  if (!user.actualUserAddressId) {
    /* userAddress = await writeExecutor.execute(createUserAddress, {
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

    user = await writeExecutor.execute(updateUser, { id: user.id, actualUserAddressId: userAddress.id }) */
  } else {
    // userAddress = await readExecutor.execute(getUserAddressById, { id: user.actualUserAddressId! })
  }

  const userProducts = await process.request<IUserProduct[]>('parseProducts', params.query)

  console.log('!!userProducts', JSON.stringify(userProducts, null, 2))

  return marketplaceRepo.getCarts({ userAddress, userProducts })
})
