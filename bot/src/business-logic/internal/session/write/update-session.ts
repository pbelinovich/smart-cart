import { buildWriteOperation } from '../../../common/write'
import { SessionState } from '../../../external'

export interface IUpdateSessionParams {
  id: string
  state: SessionState
  activeProductsRequestId?: string
  activeChangeCityRequestId?: string
}

export const updateSession = buildWriteOperation((context, params: IUpdateSessionParams) => {
  return context.sessionRepo.update({
    id: params.id,
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    state: params.state,
    activeProductsRequestId: params.activeProductsRequestId,
    activeChangeCityRequestId: params.activeChangeCityRequestId,
  })
}, [])
