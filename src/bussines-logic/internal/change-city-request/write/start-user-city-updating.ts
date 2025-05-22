import { buildWriteOperation } from '../../../common/write'
import { getChangeCityRequestById } from '../read'
import { updateChangeCityRequest } from './update-change-city-request'
import { getCityBySlug } from '../../city'
import { updateUser } from '../../user'

export interface IStartChercherAreaGettingParams {
  changeCityRequestId: string
}

export const startUserCityUpdating = buildWriteOperation(async (_, params: IStartChercherAreaGettingParams, { execute }) => {
  const changeCityRequest = await execute(getChangeCityRequestById, { id: params.changeCityRequestId })

  if (!changeCityRequest || changeCityRequest.status !== 'citySelected' || changeCityRequest.error || !changeCityRequest.selectedCityId) {
    if (changeCityRequest.status !== 'canceledByUser' && !changeCityRequest.error) {
      await execute(updateChangeCityRequest, { id: params.changeCityRequestId, error: true })
    }

    return false
  }

  const edadealCity = changeCityRequest.cities.find(city => city.id === changeCityRequest.selectedCityId)

  if (!edadealCity) {
    await execute(updateChangeCityRequest, { id: params.changeCityRequestId, error: true })
    return false
  }

  const city = await execute(getCityBySlug, { slug: edadealCity.slug })

  if (city) {
    await Promise.all([
      execute(updateUser, { id: changeCityRequest.userId, actualCityId: city.id }),
      execute(updateChangeCityRequest, { id: params.changeCityRequestId, status: 'userCityUpdated' }),
    ])

    return false
  }

  await execute(updateChangeCityRequest, { id: params.changeCityRequestId, status: 'chercherAreaGetting' })

  return true
})
