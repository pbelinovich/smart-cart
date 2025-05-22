import isEqual from 'react-fast-compare'
import { buildWriteOperation } from '../../../common/write'
import { ICityEntity } from '../../../external'
import { mskChercherArea } from './msk-chercher-area'
import { getDefaultCity } from '../read'
import { removeCities } from './remove-cities'

export const createDefaultCity = buildWriteOperation(async (context, _, { execute }) => {
  const defaultCity = await execute(getDefaultCity, {})
  const city: ICityEntity = {
    id: context.cityRepo.getNewId(),
    name: 'Москва',
    slug: 'moskva',
    region: 'Россия',
    coordinates: {
      latitude: 55.755817,
      longitude: 37.617645,
    },
    chercherArea: mskChercherArea,
  }

  if (
    !defaultCity ||
    defaultCity.name !== city.name ||
    defaultCity.slug !== city.slug ||
    defaultCity.region !== city.region ||
    !isEqual(defaultCity.coordinates, city.coordinates) ||
    defaultCity.chercherArea !== city.chercherArea
  ) {
    if (defaultCity) {
      await execute(removeCities, { ids: [defaultCity.id] })
    }

    return context.cityRepo.create(city)
  }

  return defaultCity
})
