import { buildProcessHandler } from '../../common'
import { ChangeCityRequestStatus, getChangeCityRequestById, getEdadealChercherArea, IGetChercherAreaParams } from '../../external'

export const getChercherArea = buildProcessHandler(async ({ readExecutor }, params: IGetChercherAreaParams) => {
  const changeCityRequest = await readExecutor.execute(getChangeCityRequestById, { id: params.changeCityRequestId })

  if (!changeCityRequest) {
    throw new Error(`Change city request ${params.changeCityRequestId} not found`)
  }

  const citiesSearchingStatus: ChangeCityRequestStatus = 'chercherAreaGetting'

  if (changeCityRequest.status !== citiesSearchingStatus) {
    throw new Error(`Change city request has must be ${citiesSearchingStatus} but it is ${changeCityRequest.status}`)
  }

  if (!changeCityRequest.selectedCityId) {
    throw new Error(`Change city request ${params.changeCityRequestId} has no selected city id`)
  }

  const selectedCity = changeCityRequest.cities.find(city => city.id === changeCityRequest.selectedCityId)

  if (!selectedCity) {
    throw new Error(`Change city request ${params.changeCityRequestId} has no selected city`)
  }

  const result = await readExecutor.execute(getEdadealChercherArea, { coordinates: selectedCity.coordinates })
  return result.chercherArea
})
