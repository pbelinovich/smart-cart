import { getLocale, setLocale } from '../index'
import { LOCALE_CODE } from '../constants'

test('index test', () => {
  expect(getLocale()).toBe(LOCALE_CODE.RU)
  setLocale(LOCALE_CODE.EN_US)
  expect(getLocale()).toBe(LOCALE_CODE.EN_US)
  setLocale(LOCALE_CODE.RU)
  setLocale(LOCALE_CODE.EN_US)
  expect(getLocale()).toBe(LOCALE_CODE.EN_US)
  setLocale(LOCALE_CODE.RU)
  expect(() => setLocale('')).toThrow(new Error(`setLocale: locale have to be defined but got `))
})
