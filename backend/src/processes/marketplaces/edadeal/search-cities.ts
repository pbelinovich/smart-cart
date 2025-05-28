import { buildProcessHandler } from '../../common'
import { ChangeCityRequestStatus, getChangeCityRequestById, ICity, ISearchCitiesParams, searchEdadealCities } from '../../external'
import { guid } from '@shared'

const popularCities: { [key: string]: true } = {
  moskva: true,
  'sankt-peterburg': true,
  novosibirsk: true,
  ekaterinburg: true,
  kazan: true,
  krasnoyarsk: true,
  'nizhnij-novgorod': true,
  chelyabinsk: true,
  ufa: true,
  samara: true,
}

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

  return cities
    .map<ICity>(city => ({
      id: guid(),
      marketplaceId: city.uuid,
      name: city.name,
      region: city.region,
      slug: city.slug,
      lvl: city.lvl,
      coordinates: {
        latitude: city.center.lat,
        longitude: city.center.lng,
      },
    }))
    .sort((a, b) => {
      const aIsPopular = popularCities[a.slug]
      const bIsPopular = popularCities[b.slug]

      if (aIsPopular && !bIsPopular) {
        return -1
      }

      if (!aIsPopular && bIsPopular) {
        return 1
      }

      if (a.lvl < b.lvl) {
        return -1
      }

      if (a.lvl > b.lvl) {
        return 1
      }

      if (a.name < b.name) {
        return -1
      }

      if (a.name > b.name) {
        return 1
      }

      return 0
    })
})
