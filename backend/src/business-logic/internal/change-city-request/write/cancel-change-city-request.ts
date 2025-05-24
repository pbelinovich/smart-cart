import { buildWriteOperation } from '../../../common/write'
import { getChangeCityRequestById } from '../read'
import { updateChangeCityRequest } from './update-change-city-request'
import { relatedEntitiesExist } from '../../../common/guardians'

export interface ICancelChangeCityRequestParams {
  changeCityRequestId: string
  userId: string
}

export const cancelChangeCityRequest = buildWriteOperation(
  async (_, params: ICancelChangeCityRequestParams, { execute }) => {
    const changeCityRequest = await execute(getChangeCityRequestById, { id: params.changeCityRequestId })

    if (!changeCityRequest || changeCityRequest.status !== 'citiesFound' || changeCityRequest.error) {
      if (changeCityRequest.status !== 'canceledByUser' && !changeCityRequest.error) {
        await execute(updateChangeCityRequest, { id: params.changeCityRequestId, error: true })
      }

      return false
    }

    await execute(updateChangeCityRequest, { id: params.changeCityRequestId, status: 'canceledByUser' })

    return true
  },
  [
    relatedEntitiesExist(
      c => c.changeCityRequestRepo,
      p => p.changeCityRequestId
    ),
  ]
)
