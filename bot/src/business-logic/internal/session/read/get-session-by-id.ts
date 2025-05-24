import { buildGetByIdOperation } from '../../../common/read'

export const getSessionById = buildGetByIdOperation(c => c.sessionRepo, [])
