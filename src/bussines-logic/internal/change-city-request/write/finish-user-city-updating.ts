import { buildWriteOperation } from '../../../common/write'
import { getChangeCityRequestById } from '../read'
import { updateChangeCityRequest } from './update-change-city-request'
import { createCity } from '../../city/write/create-city'
import { updateUser } from '../../user'

export interface IFinishUserCityUpdatingParams {
  changeCityRequestId: string
  chercherArea: string | undefined
}

export const finishUserCityUpdating = buildWriteOperation(async (_, params: IFinishUserCityUpdatingParams, { execute }) => {
  const changeCityRequest = await execute(getChangeCityRequestById, { id: params.changeCityRequestId })

  if (!changeCityRequest || changeCityRequest.status !== 'chercherAreaGetting' || changeCityRequest.error || !params.chercherArea) {
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

  const city = await execute(createCity, {
    name: edadealCity.name,
    slug: edadealCity.slug,
    region: edadealCity.region,
    coordinates: edadealCity.coordinates,
    chercherArea: params.chercherArea,
  })

  await Promise.all([
    execute(updateUser, { id: changeCityRequest.userId, actualCityId: city.id }),
    execute(updateChangeCityRequest, { id: params.changeCityRequestId, status: 'userCityUpdated' }),
  ])

  return true
})
