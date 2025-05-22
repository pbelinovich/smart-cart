import { buildReadOperation } from '../../../common/read'
import { getCityBySlug } from './get-city-by-slug'

export const getDefaultCity = buildReadOperation((_, __, { execute }) => {
  return execute(getCityBySlug, { slug: 'moskva' })
}, [])
