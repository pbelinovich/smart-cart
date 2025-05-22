import { buildWriteOperation } from '../../../common/write'
import { getChangeCityRequestById } from '../read'
import { updateChangeCityRequest } from './update-change-city-request'

export interface IStartCitiesSearchingParams {
  changeCityRequestId: string
}

export const startCitiesSearching = buildWriteOperation(async (_, params: IStartCitiesSearchingParams, { execute }) => {
  const changeCityRequest = await execute(getChangeCityRequestById, { id: params.changeCityRequestId })

  if (!changeCityRequest || changeCityRequest.status !== 'created' || changeCityRequest.error) {
    if (changeCityRequest.status !== 'canceledByUser' && !changeCityRequest.error) {
      await execute(updateChangeCityRequest, { id: params.changeCityRequestId, error: true })
    }

    return
  }

  await execute(updateChangeCityRequest, { id: params.changeCityRequestId, status: 'citiesSearching' })
})
