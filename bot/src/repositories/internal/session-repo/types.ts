import { IEntity } from '../../external'

export type SessionState = 'idle' | 'choosingCity' | 'confirmingCity'

export interface ISessionEntity extends IEntity {
  userId: string
  telegramId: number
  createDate: string
  expiresAt: number
  state: SessionState
}
