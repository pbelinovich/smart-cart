import { DataBaseEventHandler, IAbstractSession, INonUpdatableRepo, SessionUnsavedChanges } from '../types'

export abstract class Session implements IAbstractSession {
  private subs: DataBaseEventHandler<any>[] = []
  private unsubs: Array<() => void> = []

  unsavedChanges: SessionUnsavedChanges = {}

  subscribe = (sub: DataBaseEventHandler<any>) => {
    this.subs.push(sub)

    return () => {
      this.subs = this.subs.filter(x => x !== sub)
    }
  }

  trigger = (event: any) => {
    this.subs.forEach(x => x(event))
  }

  registerRepo = (repo: INonUpdatableRepo<any>) => {
    const unsub = repo.subscribe(event => {
      this.unsavedChanges[repo.collectionName] = this.unsavedChanges[repo.collectionName] || {}
      const id = event.entity.id
      const existsEvent = this.unsavedChanges[repo.collectionName][id]
      if (existsEvent && existsEvent.kind === 'updated' && event.kind === 'updated') {
        this.unsavedChanges[repo.collectionName][id] = {
          kind: 'updated',
          entity: event.entity,
          prevEntity: existsEvent.prevEntity, // что бы сохранить именно изначальный объект сущности
          // а не состояние до последнее не сохраненного изменение
          // в случаях когда в рамках сессии делается обновление несколько раз
        }
      } else {
        this.unsavedChanges[repo.collectionName][id] = event
      }
    })

    this.unsubs.push(unsub)
  }

  saveChanges() {
    Object.keys(this.unsavedChanges).forEach(entityName => {
      Object.values(this.unsavedChanges[entityName]).forEach(event => {
        this.trigger({
          entity: entityName as any,
          event: event,
        })
      })
    })

    this.unsavedChanges = {}

    return Promise.resolve()
  }

  dispose() {
    this.subs = []
    this.unsubs.forEach(x => x())
  }
}
