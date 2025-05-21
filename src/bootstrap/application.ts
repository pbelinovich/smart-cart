import { IReadOperationContext, IWriteOperationContext, DataBaseEvent, IStorageManager, IQueryableRepo } from './external'
import { ReposFactory } from './repos-factory'
import { StoragesFactory } from './storages-factory'
import { ExecutorTransactionFactory, IOperationExecutor, OperationExecutor } from '@shared'
import { ExternalReposFactory } from './external-repos-factory'

export interface IAppExecutors {
  readExecutor: IOperationExecutor<IReadOperationContext>
  writeExecutor: IOperationExecutor<IWriteOperationContext>
}

export interface IAppExecutorsGetterParams {
  proxy?: string
  onUseReadRepo?: (repo: IQueryableRepo<any>) => void
}

export interface IApp {
  getExecutors: (params: IAppExecutorsGetterParams) => IAppExecutors
  database: IStorageManager<any, DataBaseEvent>
  memoryStorage: IStorageManager<any, DataBaseEvent>
}

export const getAppInstance = (): IApp => {
  const storagesFactory = new StoragesFactory()

  const database = storagesFactory.initDatabase()
  const memoryStorage = storagesFactory.initMemoryStorage()

  return {
    getExecutors: params => {
      const externalReposFactory = new ExternalReposFactory(params.proxy)
      const onGetRepo = params.onUseReadRepo || (() => undefined)

      const readExecutorTransactionFactory: ExecutorTransactionFactory<IReadOperationContext> = () => {
        const readMemoryStorageSession = memoryStorage.createSession()
        const readDatabaseSession = database.createSession({ noTracking: true })

        readMemoryStorageSession.open()
        readDatabaseSession.open()

        const readReposFactory = new ReposFactory(readDatabaseSession, readMemoryStorageSession)

        return {
          context: {
            get absentProductRepo() {
              onGetRepo(readReposFactory.absentProductRepo)
              return readReposFactory.absentProductRepo
            },
            get aiProductsListRepo() {
              onGetRepo(readReposFactory.aiProductsListRepo)
              return readReposFactory.aiProductsListRepo
            },
            get presentProductRepo() {
              onGetRepo(readReposFactory.presentProductRepo)
              return readReposFactory.presentProductRepo
            },
            get productRepo() {
              onGetRepo(readReposFactory.productRepo)
              return readReposFactory.productRepo
            },
            get productsRequestRepo() {
              onGetRepo(readReposFactory.productsRequestRepo)
              return readReposFactory.productsRequestRepo
            },
            get productsResponseRepo() {
              onGetRepo(readReposFactory.productsResponseRepo)
              return readReposFactory.productsResponseRepo
            },
            get userRepo() {
              onGetRepo(readReposFactory.userRepo)
              return readReposFactory.userRepo
            },
            get mistralRepo() {
              return externalReposFactory.mistralRepo
            },
            get edadealRepo() {
              return externalReposFactory.edadealRepo
            },
          },
          finishTransaction: () => Promise.resolve(undefined),
          abortTransaction: () => Promise.resolve(undefined),
        }
      }

      const readExecutor = OperationExecutor.create(readExecutorTransactionFactory)

      const writeExecutorTransactionFactory: ExecutorTransactionFactory<IWriteOperationContext> = () => {
        const writeMemoryStorageSession = memoryStorage.createSession()
        const writeDatabaseSession = database.createSession()

        writeMemoryStorageSession.open()
        writeDatabaseSession.open()

        const writeReposFactory = new ReposFactory(writeDatabaseSession, writeMemoryStorageSession)

        return {
          context: {
            readExecutor,
            get absentProductRepo() {
              return writeReposFactory.absentProductRepo
            },
            get aiProductsListRepo() {
              return writeReposFactory.aiProductsListRepo
            },
            get presentProductRepo() {
              return writeReposFactory.presentProductRepo
            },
            get productRepo() {
              return writeReposFactory.productRepo
            },
            get productsRequestRepo() {
              return writeReposFactory.productsRequestRepo
            },
            get productsResponseRepo() {
              return writeReposFactory.productsResponseRepo
            },
            get userRepo() {
              return writeReposFactory.userRepo
            },
            get mistralRepo() {
              return externalReposFactory.mistralRepo
            },
            get edadealRepo() {
              return externalReposFactory.edadealRepo
            },
          },
          finishTransaction: async () => {
            await writeDatabaseSession.saveChanges()
            await writeMemoryStorageSession.saveChanges()

            writeDatabaseSession.dispose()
            writeMemoryStorageSession.dispose()
          },
          abortTransaction: () => {
            writeDatabaseSession.dispose()
            writeMemoryStorageSession.dispose()

            return Promise.resolve()
          },
        }
      }

      return {
        readExecutor,
        writeExecutor: OperationExecutor.create(writeExecutorTransactionFactory),
      }
    },

    database,
    memoryStorage,
  }
}

export type AppInstance = ReturnType<typeof getAppInstance>
