import { IFingerprint } from '@shared'

export type SSRData = { [key: string]: any }

export interface ISSRData {
  preloadedState: SSRData | undefined
  authToken: SSRData | undefined
}

export interface IBrowserConfig extends IFingerprint {
  headless: boolean
  stealthMode: boolean
  blockResources: boolean
}

export interface ISSRScraper {
  scrape: (url: string) => Promise<ISSRData | undefined>
}
