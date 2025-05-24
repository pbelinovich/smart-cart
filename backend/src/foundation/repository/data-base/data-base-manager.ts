import { StorageManager } from '../common'
import { DocumentStore } from 'ravendb'
import { DataBaseSession } from './data-base-session'
import { BaseDbEvent, CreateSessionParams } from '../types'

export class DataBaseManager<TEvents extends BaseDbEvent = BaseDbEvent> extends StorageManager<DataBaseSession, TEvents> {
  constructor(private storage: DocumentStore) {
    super()
  }

  createSession = (params?: CreateSessionParams) => {
    const dbSession = new DataBaseSession(this.storage, params)
    dbSession.subscribe(this.trigger)
    return dbSession
  }
}
