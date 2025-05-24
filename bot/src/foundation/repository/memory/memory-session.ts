import { Session } from '../common'
import { IEntity, ISession, EntityEvent } from '../types'
import { MemoryStorage, MemoryStorageCollection } from './memory-storage'
import { MemoryQuery } from './memory-query'

type Change = { collectionName: string; entityId: string; event: EntityEvent<any> }

export class MemorySession extends Session implements ISession<MemoryQuery<any>> {
  private changes: Change[] = []
  private backupChanges: Change[] = []
  private opened = false

  private checkChange = ({ collectionName, entityId, event }: Change, prevEntity: any) => {
    if (event.kind === 'created' && prevEntity !== null) {
      throw new Error(`Entity with id ${entityId} already exists in collection ${collectionName}`)
    }

    if ((event.kind === 'updated' || event.kind === 'removed') && prevEntity === null) {
      throw new Error(`Entity with id ${entityId} does not exist in collection ${collectionName}`)
    }
  }

  private applyChanges = async () => {
    const changes = this.changes.map(x => x)

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i]
      const { collectionName, entityId, event } = change
      const prevEntity = await this.storage.load(collectionName, entityId)

      this.checkChange(change, prevEntity)
      this.backupChanges.push(change)

      if (event.kind === 'created' || event.kind === 'updated') {
        await this.storage.store(collectionName, entityId, event.entity)
      } else if (event.kind === 'removed') {
        await this.storage.delete(collectionName, entityId)
      }
    }
  }

  private rollbackChanges = async () => {
    for (let i = this.backupChanges.length - 1; i >= 0; i--) {
      const { collectionName, entityId, event } = this.backupChanges[i]

      if (event.kind === 'created') {
        await this.storage.delete(collectionName, entityId)
      } else if (event.kind === 'updated' || event.kind === 'removed') {
        await this.storage.store(collectionName, entityId, event.kind === 'updated' ? event.prevEntity : event.entity)
      }
    }
  }

  private clearChanges = () => {
    this.changes = []
    this.backupChanges = []
  }

  private all = async <T extends IEntity>(collectionName: string): Promise<T[]> => {
    try {
      const prevCollection = await this.storage.getCollection<T>(collectionName)
      const nextCollection: MemoryStorageCollection<T> = { ...prevCollection }

      const changes = this.changes.map(x => x)

      for (let i = 0; i < changes.length; i++) {
        const change = changes[i]
        const { entityId, event } = change
        const prevEntity = prevCollection[entityId]

        this.checkChange(change, prevEntity)

        if (event.kind === 'created' || event.kind === 'updated') {
          nextCollection[entityId] = event.entity
        } else {
          delete nextCollection[entityId]
        }
      }

      return Object.values(nextCollection)
    } catch (e: any) {
      throw new Error(
        `Something went wrong while trying to apply changes from a transaction while getting a list of all records.${
          e.message ? ` Message: ${e.message}` : ''
        }`
      )
    }
  }

  constructor(private readonly storage: MemoryStorage) {
    super()
  }

  attach = () => {
    throw new Error('Not implemented')
  }
  getAttachment = () => {
    throw new Error('Not implemented')
  }
  open = () => {
    if (this.opened) {
      throw new Error('Session is already opened')
    }

    this.clearChanges()
    this.opened = true
  }

  async saveChanges() {
    if (!this.opened) {
      throw new Error('Session is not opened')
    }

    try {
      await this.applyChanges()
      await super.saveChanges()
    } catch (e) {
      await this.rollbackChanges()
      this.clearChanges()
      throw e
    }
  }

  dispose() {
    super.dispose()
    this.clearChanges()
    this.opened = false
  }

  query = <T extends IEntity>(collectionName: string) => {
    return new MemoryQuery<T>(collectionName, this.all)
  }

  load = <T extends IEntity>(collectionName: string, id: string) => {
    let foundEvent: EntityEvent<T> | undefined

    const changes = this.changes.map(x => x)

    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i]

      if (change.collectionName === collectionName && change.entityId === id) {
        foundEvent = change.event
        break
      }
    }

    if (foundEvent !== undefined) {
      return Promise.resolve(foundEvent.kind === 'removed' ? null : foundEvent.entity)
    }

    return this.storage.load<T>(collectionName, id)
  }

  store = async <T extends IEntity>(collectionName: string, id: string, entity: T) => {
    const prevEntity = await this.storage.load<T>(collectionName, id)
    const changes = this.changes.map(x => x)

    let prevEvent: EntityEvent<T> | undefined
    let nextEvent: EntityEvent<T> = prevEntity ? { kind: 'updated', entity, prevEntity } : { kind: 'created', entity }

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i]

      if (change.collectionName === collectionName && change.entityId === id) {
        prevEvent = change.event
      }
    }

    if (prevEvent) {
      if (prevEvent.kind === 'created' || prevEvent.kind === 'updated') {
        nextEvent = { kind: 'updated', entity, prevEntity: prevEntity || prevEvent.entity }
      } else if (prevEvent.kind === 'removed') {
        nextEvent = { kind: 'created', entity }
      }
    }

    this.changes = [...this.changes, { collectionName, entityId: id, event: nextEvent }]
  }

  update = async <T extends IEntity>(collectionName: string, rawEntity: T, updates: Partial<T>) => {
    const data = Object.assign(rawEntity, updates)
    await this.store(collectionName, rawEntity.id, Object.assign(rawEntity, updates))
    return data
  }

  delete = async (collectionName: string, id: string) => {
    const entity = await this.storage.load(collectionName, id)

    if (entity !== null) {
      this.changes = [...this.changes, { collectionName, entityId: id, event: { kind: 'removed', entity } }]
    }
  }
}
