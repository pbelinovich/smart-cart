import { buildWriteOperation } from '../../../common/write'
import { ICityEntity, ICoordinates } from '../../../external'

export interface ICreateCityParams {
  name: string
  slug: string
  region: string
  coordinates: ICoordinates
  chercherArea: string
}

export const createCity = buildWriteOperation((context, params: ICreateCityParams) => {
  const city: ICityEntity = {
    id: context.cityRepo.getNewId(),
    name: params.name,
    slug: params.slug,
    region: params.region,
    coordinates: params.coordinates,
    chercherArea: params.chercherArea,
  }

  return context.cityRepo.create(city)
})
