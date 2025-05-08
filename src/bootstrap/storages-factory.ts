import DocumentStore from 'ravendb'
import { DataBaseEvent, DataBaseManager, MemoryStorage, MemoryStorageManager } from './external'

export class StoragesFactory {
  initDatabase = () => {
    const storage = new DocumentStore('http://localhost:8081', 'smart-cart-db')
    storage.initialize()
    return new DataBaseManager<DataBaseEvent>(storage)
  }

  initMemoryStorage = () => {
    const storage = new MemoryStorage()
    return new MemoryStorageManager<DataBaseEvent>(storage)
  }
}
