import { IEntity } from '../types'

export type MemoryStorageCollection<T> = { [id: string]: T }
export type MemoryStorageState = { [collectionName: string]: MemoryStorageCollection<any> }

export class MemoryStorage {
  private state: MemoryStorageState = {}

  load = <T extends IEntity>(collectionName: string, id: string): Promise<T | null> => {
    return Promise.resolve(this.state[collectionName]?.[id] ?? null)
  }

  store = <T extends IEntity>(collectionName: string, id: string, entity: T) => {
    if (!this.state[collectionName]) {
      this.state[collectionName] = {}
    }

    this.state[collectionName][id] = entity

    return Promise.resolve()
  }

  delete = (collectionName: string, id: string) => {
    if (this.state[collectionName]) {
      delete this.state[collectionName][id]
    }

    return Promise.resolve()
  }

  getCollection = <T extends IEntity>(collectionName: string): Promise<MemoryStorageCollection<T>> => {
    return Promise.resolve(this.state[collectionName])
  }
}
