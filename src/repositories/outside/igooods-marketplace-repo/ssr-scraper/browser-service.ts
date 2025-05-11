import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { Browser, Page, ResourceType } from 'puppeteer'
import { IBrowserConfig } from './types'

const blockedResourcesMap: { [key in ResourceType]?: true } = {
  image: true,
  stylesheet: true,
  font: true,
  media: true,
}

export class BrowserService {
  private browser: Browser | null = null
  private page: Page | null = null

  constructor(private config: IBrowserConfig) {
    if (this.config.stealthMode) {
      puppeteer.use(StealthPlugin())
    }
  }

  private setupRequestInterception = async () => {
    if (!this.page) throw new Error('Page not initialized')

    await this.page.setRequestInterception(true)

    this.page.on('request', req => (blockedResourcesMap[req.resourceType()] ? req.abort() : req.continue()))
  }

  getPage = () => {
    if (!this.page) throw new Error('Page not initialized')

    return this.page
  }

  launch = async () => {
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
        '--disable-infobars',
        `--window-size=${this.config.viewport.width},${this.config.viewport.height}`,
        '--disable-features=IsolateOrigins,site-per-process',
        // '--proxy-server=http://46.172.36.213:8080',
      ],
    })

    this.page = await this.browser.newPage()

    await this.page.setUserAgent(this.config.userAgent)
    await this.page.setViewport(this.config.viewport)

    if (this.config.blockResources) {
      await this.setupRequestInterception()
    }
  }

  close = async () => {
    if (!this.browser) return
    await this.browser.close()
    this.browser = null
    this.page = null
  }

  navigate = (url: string) => {
    if (!this.page) throw new Error('Page not initialized')

    return this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
  }
}
