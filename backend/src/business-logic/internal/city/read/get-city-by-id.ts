import { buildGetByIdOperation } from '../../../common/read'

export const getCityById = buildGetByIdOperation(c => c.cityRepo, [])
