import { IAppExecutors, ProcessInitData } from './external'

export interface IProcessContext extends IAppExecutors {
  processInitData: ProcessInitData
  log: (message: string) => void
}

export type ProcessHandler<TParams, TResult> = (context: IProcessContext, params: TParams) => Promise<TResult>
