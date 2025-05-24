import { StorageManager } from '../common'
import { MemorySession } from './memory-session'
import { MemoryStorage } from './memory-storage'
import { BaseDbEvent } from '../types'

export class MemoryStorageManager<TEvents extends BaseDbEvent = BaseDbEvent> extends StorageManager<MemorySession, TEvents> {
  constructor(private storage: MemoryStorage) {
    super()
  }

  createSession = () => {
    const session = new MemorySession(this.storage)
    session.subscribe(this.trigger)
    return session
  }
}
