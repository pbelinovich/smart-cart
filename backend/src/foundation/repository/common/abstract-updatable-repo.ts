import { entityToDTO } from '../tools'
import { IEntity, IUpdatableRepo } from '../types'
import { AbstractNonUpdatableRepo } from './abstract-non-updatable-repo'

export abstract class AbstractUpdatableRepo<TQuery, TEntity extends IEntity>
  extends AbstractNonUpdatableRepo<TQuery, TEntity>
  implements IUpdatableRepo<TEntity>
{
  protected abstract updatingMiddleware: (nextEntity: TEntity, prevEntity: TEntity) => Promise<TEntity> | TEntity

  async update(data: Partial<TEntity> & IEntity): Promise<TEntity> {
    const id = data.id

    if (!id) {
      throw new Error('Unable to update entity! Id is not specified!')
    }

    const rawEntity = await this.session.load<TEntity>(this.collectionName, id)

    if (!rawEntity) {
      throw new Error(`Unable to update entity! Entity with id ${data.id} is not found!`)
    }

    const prevEntity = entityToDTO<TEntity>(rawEntity)

    const updatedRawEntity = await this.session.update(this.collectionName, rawEntity, data)

    const nextEntityDto = entityToDTO<TEntity>(updatedRawEntity)

    const nextEntity = await this.updatingMiddleware(nextEntityDto, prevEntity)

    this.trigger({ kind: 'updated', entity: nextEntity, prevEntity })

    return nextEntity
  }
}
