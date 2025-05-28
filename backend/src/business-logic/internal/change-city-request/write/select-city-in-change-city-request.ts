import { buildWriteOperation } from '../../../common/write'
import { getChangeCityRequestById } from '../read'
import { updateChangeCityRequest } from './update-change-city-request'
import { relatedEntitiesExist } from '../../../common/guardians'

export interface ISelectCityParams {
  changeCityRequestId: string
  userId: string
  selectedCityId: string
}

export const selectCityInChangeCityRequest = buildWriteOperation(
  async (_, params: ISelectCityParams, { execute }) => {
    const changeCityRequest = await execute(getChangeCityRequestById, { id: params.changeCityRequestId })

    if (!changeCityRequest || changeCityRequest.status !== 'citiesFound' || changeCityRequest.error) {
      if (changeCityRequest.status !== 'canceledByUser' && !changeCityRequest.error) {
        await execute(updateChangeCityRequest, { id: params.changeCityRequestId, error: true })
      }

      return false
    }

    const foundCity = changeCityRequest.cities.find(city => city.id === params.selectedCityId)

    if (!foundCity) {
      await execute(updateChangeCityRequest, { id: params.changeCityRequestId, error: true })
      return false
    }

    await execute(updateChangeCityRequest, {
      id: params.changeCityRequestId,
      status: 'citySelected',
      selectedCityId: foundCity.id,
    })

    return true
  },
  [
    relatedEntitiesExist(
      c => c.changeCityRequestRepo,
      p => p.changeCityRequestId
    ),
  ]
)
