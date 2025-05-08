import * as stream from 'readable-stream'
import { IPathGenerator } from '../../shared/path-generator'

export interface IEntity {
  id: string
}

export type ConditionFilterBuilder = (field: string, value: any) => FilterInfo
export type LogicFilterBuilder = (...operands: FilterInfo[]) => FilterInfo

export type FilterBuilder = { [key in ConditionFilterInfoPredicate]: ConditionFilterBuilder } & {
  [key in LogicFilterInfoType]: LogicFilterBuilder
}

export type QueryPathGetter<T> = (path: IPathGenerator<Required<T>>) => string
export type QueryFiltersGetter<T> = (_: FilterBuilder, path: IPathGenerator<Required<T>>) => FilterInfo | undefined

export type OrderDirection = 'ASC' | 'DESC'

export interface DataWithSize<T> {
  data: T[]
  size: number
}

export type QueryMiddleware<T extends object> = (query: IQueryBuilder<T>) => Promise<IQueryBuilder<T>> | IQueryBuilder<T>

export interface IQueryBuilder<T extends object> {
  where: (filtersGetter: QueryFiltersGetter<T>) => IQueryBuilder<T>
  all: () => Promise<T[]>
  allWithCount: () => Promise<DataWithSize<T>>
  first: () => Promise<T>
  firstOrNull: () => Promise<T | null>
  count: () => Promise<number>
  take: (count: number) => IQueryBuilder<T>
  skip: (count: number) => IQueryBuilder<T>
  distinct: () => IQueryBuilder<T>
  order: (pathGetter: QueryPathGetter<T>, direction?: OrderDirection) => IQueryBuilder<T>
  numericOrder: (pathGetter: QueryPathGetter<T>, direction?: OrderDirection) => IQueryBuilder<T>
  registerBeforeExecutionMiddleware: (middleware: QueryMiddleware<T>) => IQueryBuilder<T>
}

export interface IQueryableRepo<T extends object> {
  query: IQueryBuilder<T>
  readonly collectionName: string
}

export interface IReadOnlyRepo<T extends IEntity> extends IQueryableRepo<T> {
  getById: (id: string) => Promise<T>
  getByIdOrUndefined: (id: string) => Promise<T | undefined>
}

export interface INonUpdatableRepo<T extends IEntity> extends IReadOnlyRepo<T> {
  create: (data: T) => Promise<T>
  remove: (id: string) => Promise<void>
  subscribe: (sub: (event: EntityEvent<T>) => void) => () => void
  getNewId: (preferredId?: string) => string
}

export interface IUpdatableRepo<T extends IEntity> extends INonUpdatableRepo<T> {
  update: (data: Partial<T> & IEntity) => Promise<T>
}

export type SessionUnsavedChanges = {
  [collectionName: string]: {
    [id: string]: EntityEvent<any>
  }
}

export interface IAbstractSession {
  unsavedChanges: SessionUnsavedChanges
  subscribe: (sub: DataBaseEventHandler<any>) => () => void
  trigger: (event: any) => void
  registerRepo: (repo: INonUpdatableRepo<any>) => void
  saveChanges: () => Promise<void>
  dispose: () => void
}

export interface ISession<TQuery> extends IAbstractSession {
  open: () => void
  load: <T extends IEntity>(collectionName: string, id: string) => Promise<T | null>
  store: <T extends IEntity>(collectionName: string, id: string, entity: T) => Promise<void>
  update: <T extends IEntity>(collectionName: string, rawEntity: T, update: Partial<T>) => Promise<T>
  delete: (collectionName: string, id: string) => Promise<void>
  query: (collectionName: string, isIndex: boolean) => TQuery
  getAttachment: (id: string, name: string) => Promise<stream.Readable>
  attach: (id: string, fileName: string, file: Buffer) => Promise<void>
}

export type EntityEvent<T> =
  | {
      kind: 'created'
      entity: T
    }
  | {
      kind: 'removed'
      entity: T
    }
  | {
      kind: 'updated'
      entity: T
      prevEntity: T
    }

export type BaseDbEvent = {
  entity: string
  event: EntityEvent<any>
}

export type DataBaseEventHandler<TEvents> = (event: TEvents) => void

export type CreateSessionParams = { noTracking?: boolean; noCaching?: boolean }

export interface IStorageManager<TSession, TEvents extends BaseDbEvent = BaseDbEvent> {
  subscribe: (sub: DataBaseEventHandler<TEvents>) => () => void
  trigger: (event: TEvents) => void
  createSession: () => TSession
}

export type LogicFilterInfoType = 'and' | 'or'

export type ConditionFilterInfoPredicate =
  | 'eq'
  | 'ge'
  | 'le'
  | 'ne'
  | 'in'
  | 'notin'
  | 'gt'
  | 'lt'
  | 'contains'
  | 'isnull'
  | 'notnull'
  | 'regex'
  | 'startsWith'
  | 'endsWith'
  | 'arrayContains'

export type LogicFilterInfo = {
  type: LogicFilterInfoType
  operands: FilterInfo[]
}

export type ConditionFilterInfo = {
  type: 'condition'
  field: string
  predicate: ConditionFilterInfoPredicate
  value: any
}

export type FilterInfo = LogicFilterInfo | ConditionFilterInfo
