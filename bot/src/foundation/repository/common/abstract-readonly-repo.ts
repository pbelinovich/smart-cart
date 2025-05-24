import { IEntity, IReadOnlyRepo, ISession } from '../types'
import { entityToDTO } from '../tools'
import { EntityNotFoundError } from '../errors'
import { AbstractQueryableRepo } from './abstract-queryable-repo'

export abstract class AbstractReadonlyRepo<TQuery, TEntity extends IEntity>
  extends AbstractQueryableRepo<TQuery, TEntity>
  implements IReadOnlyRepo<TEntity>
{
  protected abstract getByIdMiddleware: (entity: TEntity) => Promise<TEntity | undefined> | TEntity | undefined

  protected constructor(protected session: ISession<TQuery>, public collectionName: string) {
    super(session, collectionName)
  }

  private getNotFoundError = (id: string) => {
    return new EntityNotFoundError(`Unable to get entity by id! Entity${id ? ` with id "${id}"` : ''} is not found!`)
  }

  getById = async (id: string) => {
    if (!id.startsWith(`${this.collectionName}/`)) {
      throw new Error(`Wrong entity id! It sholud start with ${this.collectionName} but got ${id}`)
    }
    const entity = await this.session.load<TEntity>(this.collectionName, id)

    if (!entity) {
      throw this.getNotFoundError(id)
    }

    const dto = entityToDTO(entity)
    const dtoAfterMiddleware = await this.getByIdMiddleware(dto)

    if (!dtoAfterMiddleware) {
      throw this.getNotFoundError(id)
    }

    return dtoAfterMiddleware
  }

  getByIdOrUndefined = async (id: string) => {
    if (!id.startsWith(`${this.collectionName}/`)) {
      throw new Error('Wrong entity id! It sholud start with ${this.collectionName} but got ${id}')
    }
    try {
      return await this.getById(id)
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        return undefined
      }
      throw e
    }
  }
}
