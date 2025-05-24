import { IEntity, INonUpdatableRepo, EntityEvent, ISession } from '../types'
import { guid, snapshot } from '@shared'
import { entityToDTO } from '../tools'
import { AbstractReadonlyRepo } from './abstract-readonly-repo'

export abstract class AbstractNonUpdatableRepo<TQuery, TEntity extends IEntity>
  extends AbstractReadonlyRepo<TQuery, TEntity>
  implements INonUpdatableRepo<TEntity>
{
  protected abstract creationMiddleware: (entity: TEntity) => Promise<TEntity> | TEntity
  protected abstract removingMiddleware: (entity: TEntity) => Promise<void> | void

  protected subs: Array<(event: EntityEvent<TEntity>) => void> = []
  protected trigger = (event: EntityEvent<TEntity>) => {
    this.subs.forEach(x => x(event))
  }

  public getNewId = (value: string = guid()) => {
    return `${this.collectionName}/${value}`
  }

  protected constructor(protected session: ISession<TQuery>, public collectionName: string) {
    super(session, collectionName)
    session.registerRepo(this)
  }

  subscribe = (sub: (event: EntityEvent<TEntity>) => void) => {
    this.subs.push(sub)

    return () => {
      this.subs = this.subs.filter(x => x !== sub)
    }
  }

  create = async (data: TEntity) => {
    if (typeof data.id !== 'string') {
      throw new Error('Unable to create entity! Entities ID have to be a string')
    }

    if (!data.id.startsWith(`${this.collectionName}/`)) {
      throw new Error(`Unable to create entity! Entities ID have to starts with collection name but got "${data.id}"`)
    }

    const copy = await this.creationMiddleware(snapshot(data))
    await this.session.store(this.collectionName, data.id, copy)

    const result = entityToDTO<TEntity>(copy)

    this.trigger({ kind: 'created', entity: result })

    return result
  }

  remove = async (id: string) => {
    const entity = await this.getById(id)
    await this.removingMiddleware(entity)
    await this.session.delete(this.collectionName, id)
    this.trigger({ kind: 'removed', entity })
  }
}
