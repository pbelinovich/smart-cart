import { IReadOperationContext, IWriteOperationContext, DataBaseEvent, IStorageManager, IQueryableRepo, IMarketplace } from './external'
import { ReposFactory } from './repos-factory'
import { ExternalReposFactory } from './external-repos-factory'
import { StoragesFactory } from './storages-factory'
import { ExecutorTransactionFactory, IOperationExecutor, OperationExecutor } from '@shared'

export interface IAppExecutors {
  readExecutor: IOperationExecutor<IReadOperationContext>
  writeExecutor: IOperationExecutor<IWriteOperationContext>
}

export interface IAppExecutorsGetterParams {
  onUseReadRepo?: (repo: IQueryableRepo<any>) => void
}

export interface IAppExternal {
  edadealMarketplaceRepo: IMarketplace
  igooodsMarketplaceRepo: IMarketplace
}

export interface IApp {
  getExecutors: (params: IAppExecutorsGetterParams) => IAppExecutors
  database: IStorageManager<any, DataBaseEvent>
  memoryStorage: IStorageManager<any, DataBaseEvent>
  external: IAppExternal
}

export const getAppInstance = (): IApp => {
  const storagesFactory = new StoragesFactory()
  const externalReposFactory = new ExternalReposFactory()

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
            get authRepo() {
              onGetRepo(readReposFactory.authRepo)
              return readReposFactory.authRepo
            },
            get userRepo() {
              onGetRepo(readReposFactory.userRepo)
              return readReposFactory.userRepo
            },
            get userAddressRepo() {
              onGetRepo(readReposFactory.userAddressRepo)
              return readReposFactory.userAddressRepo
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
            get authRepo() {
              return writeReposFactory.authRepo
            },
            get userRepo() {
              return writeReposFactory.userRepo
            },
            get userAddressRepo() {
              return writeReposFactory.userAddressRepo
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

    external: {
      get edadealMarketplaceRepo() {
        return externalReposFactory.edadealMarketplaceRepo
      },
      get igooodsMarketplaceRepo() {
        return externalReposFactory.igooodsMarketplaceRepo
      },
    },
  }
}

export type AppInstance = ReturnType<typeof getAppInstance>
