import { buildReadOperation } from '../../../common/read'

export interface IGetCityBySlugParams {
  slug: string
}

export const getCityBySlug = buildReadOperation((context, params: IGetCityBySlugParams) => {
  return context.cityRepo.query.where((_, p) => _.eq(p('slug'), params.slug)).firstOrNull()
}, [])
