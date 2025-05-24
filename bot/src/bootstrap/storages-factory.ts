import { DataBaseEvent, MemoryStorage, MemoryStorageManager } from './external'

export class StoragesFactory {
  initMemoryStorage = () => {
    const storage = new MemoryStorage()
    return new MemoryStorageManager<DataBaseEvent>(storage)
  }
}
