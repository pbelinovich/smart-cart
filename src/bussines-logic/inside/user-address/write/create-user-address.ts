import { ICoordinates, IUserAddressEntity } from '../../../types'
import { buildWriteOperation } from '../../../common/write'
import { relatedEntitiesExist } from '../../../common/guardians'
import { dateTime } from '@shared'

export interface ICreateUserAddressParams {
  userId: string
  country: string
  region: string
  city: string
  street: string
  apartment: string
  coordinates: ICoordinates
}

export const createUserAddress = buildWriteOperation(
  (context, params: ICreateUserAddressParams) => {
    const userAddress: IUserAddressEntity = {
      id: context.userAddressRepo.getNewId(),
      userId: params.userId,
      createDate: dateTime.utc().toISOString(),
      country: params.country,
      region: params.region,
      city: params.city,
      street: params.street,
      apartment: params.apartment,
      coordinates: params.coordinates,
    }

    return context.userAddressRepo.create(userAddress)
  },
  [
    relatedEntitiesExist(
      c => c.userRepo,
      p => p.userId
    ),
  ]
)
