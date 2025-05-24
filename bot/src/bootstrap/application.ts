import { IReadOperationContext, IWriteOperationContext, DataBaseEvent, IStorageManager, IQueryableRepo } from './external'
import { ReposFactory } from './repos-factory'
import { StoragesFactory } from './storages-factory'
import { ExecutorTransactionFactory, IOperationExecutor, OperationExecutor } from '@shared'

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
  memoryStorage: IStorageManager<any, DataBaseEvent>
}

export const getAppInstance = (): IApp => {
  const storagesFactory = new StoragesFactory()
  const memoryStorage = storagesFactory.initMemoryStorage()

  return {
    getExecutors: params => {
      const onGetRepo = params.onUseReadRepo || (() => undefined)

      const readExecutorTransactionFactory: ExecutorTransactionFactory<IReadOperationContext> = () => {
        const readMemoryStorageSession = memoryStorage.createSession()

        readMemoryStorageSession.open()

        const readReposFactory = new ReposFactory(readMemoryStorageSession)

        return {
          context: {
            get sessionRepo() {
              onGetRepo(readReposFactory.sessionRepo)
              return readReposFactory.sessionRepo
            },
          },
          finishTransaction: () => Promise.resolve(undefined),
          abortTransaction: () => Promise.resolve(undefined),
        }
      }

      const readExecutor = OperationExecutor.create(readExecutorTransactionFactory)

      const writeExecutorTransactionFactory: ExecutorTransactionFactory<IWriteOperationContext> = () => {
        const writeMemoryStorageSession = memoryStorage.createSession()

        writeMemoryStorageSession.open()

        const writeReposFactory = new ReposFactory(writeMemoryStorageSession)

        return {
          context: {
            readExecutor,
            get sessionRepo() {
              return writeReposFactory.sessionRepo
            },
          },
          finishTransaction: async () => {
            await writeMemoryStorageSession.saveChanges()
            writeMemoryStorageSession.dispose()
          },
          abortTransaction: () => {
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

    memoryStorage,
  }
}

export type AppInstance = ReturnType<typeof getAppInstance>
