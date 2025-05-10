import { ISSRData, ISSRScraper, SSRData } from './types'
import { logError } from '../../../external'
import { BrowserService } from './browser-service'
import { Page } from 'puppeteer'
import { fingerprintGenerator } from '@shared'

export class SSRScraper implements ISSRScraper {
  private browserService: BrowserService

  constructor() {
    const fingerprint = fingerprintGenerator()

    this.browserService = new BrowserService({
      userAgent: fingerprint.userAgent,
      viewport: fingerprint.viewport,
      headless: true,
      stealthMode: true,
      blockResources: true,
    })
  }

  private parseData = (entry: string) => {
    return JSON.parse(decodeURIComponent(entry))
  }

  private extractPreloadedState = async (page: Page): Promise<SSRData | undefined> => {
    try {
      const html = await page.content()
      const match = html.match(/<script[^>]*>window\.__PRELOADED_STATE__\s*=\s*(.+)<\/script>/i)

      if (match?.[1]) {
        return this.parseData(match[1])
      }
    } catch (error) {
      logError('Error extracting PRELOADED_STATE:', error)
    }
  }

  private extractAuthToken = async (page: Page): Promise<SSRData | undefined> => {
    try {
      const cookies = await page.cookies()
      const authTokenCookie = cookies.find(c => c.name === 'authToken')

      if (authTokenCookie) {
        return this.parseData(authTokenCookie.value)
      }
    } catch (error) {
      logError('Error extracting authToken:', error)
    }
  }

  private extractData = async (): Promise<ISSRData> => {
    const page = this.browserService.getPage()
    const [preloadedState, authToken] = await Promise.all([this.extractPreloadedState(page), this.extractAuthToken(page)])

    return { preloadedState, authToken }
  }

  scrape = async (url: string): Promise<ISSRData | undefined> => {
    let result: ISSRData | undefined

    try {
      await this.browserService.launch()
      await this.browserService.navigate(url)

      result = await this.extractData()
    } finally {
      await this.browserService.close()
    }

    return result
  }
}
