import { IAppExecutors } from '../../external'

export type PublicHandlersContext = {
  readExecutor: IAppExecutors['readExecutor']
  writeExecutor: IAppExecutors['writeExecutor']
}
