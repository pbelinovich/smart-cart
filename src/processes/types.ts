import { IAppExecutors, ProcessInitData } from './external'

export interface IProcessContext extends IAppExecutors {
  processInitData: ProcessInitData
}

export type ProcessHandler<TParams, TResult> = (context: IProcessContext, params: TParams) => Promise<TResult>
