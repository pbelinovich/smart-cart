export interface IFingerprintViewport {
  width: number
  height: number
  isMobile?: boolean
}

export interface IFingerprint {
  userAgent: string
  viewport: IFingerprintViewport
}

export const fingerprints: IFingerprint[] = [
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: {
      width: 1366,
      height: 768,
    },
  },
  {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    viewport: {
      width: 1440,
      height: 900,
    },
  },
  {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: {
      width: 1920,
      height: 1080,
    },
  },
  {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: {
      width: 375,
      height: 667,
      isMobile: true,
    },
  },
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:118.0) Gecko/20100101 Firefox/118.0',
    viewport: {
      width: 1280,
      height: 720,
    },
  },
]
