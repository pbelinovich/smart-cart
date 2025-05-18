import { IReadOperationContext, IWriteOperationContext, DataBaseEvent, IStorageManager, IQueryableRepo, EdadealRepo } from './external'
import { ReposFactory } from './repos-factory'
import { MarketplaceReposFactory } from './marketplace-repos-factory'
import { StoragesFactory } from './storages-factory'
import { ExecutorTransactionFactory, IOperationExecutor, OperationExecutor } from '@shared'

export interface IAppExecutors {
  readExecutor: IOperationExecutor<IReadOperationContext>
  writeExecutor: IOperationExecutor<IWriteOperationContext>
}

export interface IAppExecutorsGetterParams {
  onUseReadRepo?: (repo: IQueryableRepo<any>) => void
}

export interface IAppMarketplaces {
  edadealRepo: EdadealRepo
}

export interface IApp {
  getExecutors: (params: IAppExecutorsGetterParams) => IAppExecutors
  database: IStorageManager<any, DataBaseEvent>
  memoryStorage: IStorageManager<any, DataBaseEvent>
  marketplaces: IAppMarketplaces
}

export const getAppInstance = (): IApp => {
  const storagesFactory = new StoragesFactory()
  const externalReposFactory = new MarketplaceReposFactory()

  const database = storagesFactory.initDatabase()
  const memoryStorage = storagesFactory.initMemoryStorage()

  return {
    getExecutors: params => {
      const onGetRepo = params.onUseReadRepo || (() => undefined)

      const readExecutorTransactionFactory: ExecutorTransactionFactory<IReadOperationContext> = () => {
        const readMemoryStorageSession = memoryStorage.createSession()
        const readDatabaseSession = database.createSession({ noTracking: true })

        readMemoryStorageSession.open()
        readDatabaseSession.open()

        const readReposFactory = new ReposFactory(readDatabaseSession, readMemoryStorageSession)

        return {
          context: {
            get aiProductsListRepo() {
              onGetRepo(readReposFactory.aiProductsListRepo)
              return readReposFactory.aiProductsListRepo
            },
            get marketplaceProductRepo() {
              onGetRepo(readReposFactory.marketplaceProductRepo)
              return readReposFactory.marketplaceProductRepo
            },
            get productRepo() {
              onGetRepo(readReposFactory.productRepo)
              return readReposFactory.productRepo
            },
            get productsRequestRepo() {
              onGetRepo(readReposFactory.productsRequestRepo)
              return readReposFactory.productsRequestRepo
            },
            get userRepo() {
              onGetRepo(readReposFactory.userRepo)
              return readReposFactory.userRepo
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
            get aiProductsListRepo() {
              return writeReposFactory.aiProductsListRepo
            },
            get marketplaceProductRepo() {
              return writeReposFactory.marketplaceProductRepo
            },
            get productRepo() {
              return writeReposFactory.productRepo
            },
            get productsRequestRepo() {
              return writeReposFactory.productsRequestRepo
            },
            get userRepo() {
              return writeReposFactory.userRepo
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

    marketplaces: {
      get edadealRepo() {
        return externalReposFactory.edadealRepo
      },
    },
  }
}

export type AppInstance = ReturnType<typeof getAppInstance>
