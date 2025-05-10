import { fingerprints } from './common'

export { IFingerprint, IFingerprintViewport } from './common'

export const fingerprintGenerator = () => {
  return fingerprints[Math.floor(Math.random() * fingerprints.length)]
}
