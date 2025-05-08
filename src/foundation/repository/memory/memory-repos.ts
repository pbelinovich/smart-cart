import { AbstractNonUpdatableRepo, AbstractUpdatableRepo } from '../common'
import { IEntity } from '../types'
import { MemoryQueryBuilder } from './memory-query-builder'
import { MemoryQuery } from './memory-query'
import { entityToDTO } from '../tools'

export abstract class MemoryNonUpdatableRepo<T extends IEntity> extends AbstractNonUpdatableRepo<MemoryQuery<T>, T> {
  protected getQuery = () => new MemoryQueryBuilder(this.session.query(this.collectionName, false), [])
}

export abstract class MemoryUpdatableRepo<T extends IEntity> extends AbstractUpdatableRepo<MemoryQuery<T>, T> {
  protected getQuery = () => new MemoryQueryBuilder(this.session.query(this.collectionName, false), [])

  update = async (data: Partial<T> & IEntity) => {
    const id = data.id

    if (!id) {
      throw new Error('Unable to update entity! Id is not specified!')
    }

    const entity = await this.session.load<T>(this.collectionName, id)

    if (!entity) {
      throw new Error(`Unable to update entity! Entity with id ${data.id} is not found!`)
    }

    const prevEntity = entityToDTO<T>(entity)
    const nextEntity = Object.assign(entityToDTO<T>(entity), data)

    await this.session.store(this.collectionName, id, nextEntity)

    this.trigger({ kind: 'updated', entity: nextEntity, prevEntity })

    return nextEntity
  }
}
