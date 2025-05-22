import { buildWriteOperation } from '../../../common/write'
import { ChangeCityRequestStatus, ICity } from '../../../external'
import { dateTime } from '@shared'

export interface IUpdateChangeCityRequestParams {
  id: string
  status?: ChangeCityRequestStatus
  error?: boolean
  cities?: ICity[]
  selectedCityId?: string
}

export const updateChangeCityRequest = buildWriteOperation(async (context, params: IUpdateChangeCityRequestParams) => {
  const changeCityRequest = await context.changeCityRequestRepo.getById(params.id)

  return context.changeCityRequestRepo.update({
    id: params.id,
    modifyDate: dateTime().utc().toISOString(),
    status: params.status || changeCityRequest.status,
    error: params.error === undefined ? changeCityRequest.error : params.error,
    cities: params.cities || changeCityRequest.cities,
    selectedCityId: params.selectedCityId || changeCityRequest.selectedCityId,
  })
}, [])
