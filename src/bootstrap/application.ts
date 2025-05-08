import {
  OperationExecutor,
  ExecutorTransactionFactory,
  IOperationExecutor,
  IReadOperationContext,
  IWriteOperationContext,
  DataBaseEvent,
  IStorageManager,
  IQueryableRepo,
} from './external'
import { ReposFactory } from './repos-factory'
import { StoragesFactory } from './storages-factory'

export interface IAppExecutors {
  readExecutor: IOperationExecutor<IReadOperationContext>
  writeExecutor: IOperationExecutor<IWriteOperationContext>
}

export interface IAppExecutorsGetterParams {
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
      const onGetRepo = params.onUseReadRepo || (() => undefined)

      const readExecutorTransactionFactory: ExecutorTransactionFactory<IReadOperationContext> = () => {
        const readMemoryStorageSession = memoryStorage.createSession()
        const readDatabaseSession = database.createSession({ noTracking: true })

        readMemoryStorageSession.open()
        readDatabaseSession.open()

        const readReposFactory = new ReposFactory(readDatabaseSession, readMemoryStorageSession)

        return {
          context: {
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
  }
}

export type AppInstance = ReturnType<typeof getAppInstance>
