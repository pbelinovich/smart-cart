import { buildWriteOperation } from '../../../common/write'
import { ICity } from '../../../external'
import { getChangeCityRequestById } from '../read'
import { updateChangeCityRequest } from './update-change-city-request'

export interface IFinishCitiesSearchingParams {
  changeCityRequestId: string
  list: ICity[] | undefined
}

export const finishCitiesSearching = buildWriteOperation(async (_, params: IFinishCitiesSearchingParams, { execute }) => {
  const changeCityRequest = await execute(getChangeCityRequestById, { id: params.changeCityRequestId })

  if (
    !changeCityRequest ||
    changeCityRequest.status !== 'citiesSearching' ||
    changeCityRequest.error ||
    !params.list ||
    !params.list.length
  ) {
    if (changeCityRequest.status !== 'canceledByUser' && !changeCityRequest.error) {
      await execute(updateChangeCityRequest, { id: params.changeCityRequestId, error: true })
    }

    return false
  }

  await execute(updateChangeCityRequest, {
    id: params.changeCityRequestId,
    status: 'citiesFound',
    cities: params.list,
  })

  return true
})
