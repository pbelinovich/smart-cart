import { Session } from '../common'
import { ISession, CreateSessionParams } from '../types'
import { DocumentStore, IDocumentQuery, IDocumentSession } from 'ravendb'
import { snapshot } from '../../../shared/object-utils'

export class DataBaseSession extends Session implements ISession<IDocumentQuery<any>> {
  private ravenDBSession: IDocumentSession | null = null

  constructor(private readonly storage: DocumentStore, private readonly params: CreateSessionParams = {}) {
    super()
  }

  attach = (id: string, fileName: string, file: Buffer) => {
    this.ravenDBSession!.advanced.attachments.store(id, fileName, file)
    return Promise.resolve()
  }

  getAttachment = (id: string, name: string) => {
    return this.ravenDBSession!.advanced.attachments.get(id, name).then(x => x!.data)
  }

  open = () => {
    if (this.ravenDBSession) {
      throw new Error('Session is already opened')
    }

    this.ravenDBSession = this.storage.openSession(this.params)
    this.ravenDBSession.advanced.maxNumberOfRequestsPerSession = Number.MAX_SAFE_INTEGER // TODO подумать как сделать лучше
  }

  async saveChanges() {
    if (!this.ravenDBSession) {
      throw new Error('Session is not opened')
    }

    /*
      это короче пока вынужденая мера. Оказывается после выполнения транзакции сохраненные данные
      не сразу видны при запросах, а видны только после того как индексы обновятся. Исключения составляют
      запросы по конкретному id, но вот query тупят пока индексы не обновятся. Выхов этой фцкнции ниже
      дожидается обновления индексов после saveChanges и резолвит saveChanges когда они обновились.
      Пока это не должно быть проблемой, но при больших нагрузках и больших объемах данных в таблицах
      это может стать проблемой и надо будет что-то с этим думать.
      Нам просто для правильной работы каналов крайне важно их пересчитывать когда индексы обновились чтобы
      получать актуальную инфу.
    */
    this.ravenDBSession.advanced.waitForIndexesAfterSaveChanges()
    await this.ravenDBSession.saveChanges()

    return super.saveChanges()
  }

  dispose() {
    super.dispose()

    if (this.ravenDBSession) {
      this.ravenDBSession.dispose()
      this.ravenDBSession = null
    }
  }

  query = <T extends object>(collectionName: string, isIndex: boolean) => {
    if (!this.ravenDBSession) {
      throw new Error('Session is not opened')
    }

    if (isIndex) {
      return this.ravenDBSession.query<T>({ indexName: collectionName })
    }
    return this.ravenDBSession.query<T>({ collection: collectionName })
  }

  load = <T extends object>(collectionName: string, id: string) => {
    if (!this.ravenDBSession) {
      throw new Error('Session is not opened')
    }

    return this.ravenDBSession.load<T>(id)
  }

  store = <T extends object>(collectionName: string, id: string, entity: T) => {
    if (!this.ravenDBSession) {
      throw new Error('Session is not opened')
    }

    const copy = snapshot(entity)
    ;(copy as any)['@metadata'] = {
      '@collection': collectionName,
    }

    return this.ravenDBSession.store(copy, id)
  }

  update = <T extends object>(collectionName: string, rawEntity: T, updates: Partial<T>) => {
    Object.keys(updates).forEach(key => {
      ;(rawEntity as any)[key] = (updates as any)[key]
    })
    return Promise.resolve(rawEntity)
  }

  delete = (collectionName: string, id: string) => {
    if (!this.ravenDBSession) {
      throw new Error('Session is not opened')
    }

    return this.ravenDBSession.delete(id)
  }
}
