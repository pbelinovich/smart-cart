import { buildProcessHandler } from '../../common'
import { ChangeCityRequestStatus, getChangeCityRequestById, ICity, ISearchCitiesParams, searchEdadealCities } from '../../external'

export const searchCities = buildProcessHandler(async ({ readExecutor }, params: ISearchCitiesParams) => {
  const changeCityRequest = await readExecutor.execute(getChangeCityRequestById, { id: params.changeCityRequestId })

  if (!changeCityRequest) {
    throw new Error(`Change city request ${params.changeCityRequestId} not found`)
  }

  const citiesSearchingStatus: ChangeCityRequestStatus = 'citiesSearching'

  if (changeCityRequest.status !== citiesSearchingStatus) {
    throw new Error(`Change city request has must be ${citiesSearchingStatus} but it is ${changeCityRequest.status}`)
  }

  const cities = await readExecutor.execute(searchEdadealCities, { query: params.query })

  return cities.map<ICity>(city => ({
    id: city.uuid,
    name: city.name,
    region: city.region,
    slug: city.slug,
    coordinates: {
      latitude: city.center.lat,
      longitude: city.center.lng,
    },
  }))
})
