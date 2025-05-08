import { IApp } from './external'

export const getExecutors = (appInstance: IApp) => {
  return appInstance.getExecutors({})
}

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
