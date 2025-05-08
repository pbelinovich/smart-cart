import { IApp } from '../external'

export const stringToFoodList = (appInstance: IApp) => (entry: string) => {
  console.log('!!', 'entry', entry)
  return entry.toLowerCase()
}
