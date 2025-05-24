import { buildGetByIdOperation } from '../../../common/read'

export const getChangeCityRequestById = buildGetByIdOperation(c => c.changeCityRequestRepo, [])
