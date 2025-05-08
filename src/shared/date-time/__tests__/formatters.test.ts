import { formatDate, formatMonthShort } from '../index'
import { setLocale } from '../index'
import { LOCALE_CODE } from '../constants'

test('formatDate formats date correctly', () => {
  setLocale(LOCALE_CODE.RU)
  expect(formatDate('')).toBe('')
  expect(formatDate('2014-12-12')).toBe('12.12.2014')
  expect(formatDate('2000-1-2')).toBe('02.01.2000')
  expect(formatDate('dsfgdsfg')).toBe('Invalid Date')
  expect(formatDate(3423434 as any)).toBe('01.01.1970')
  setLocale(LOCALE_CODE.EN_US)
  expect(formatDate('')).toBe('')
  expect(formatDate('2014-12-12')).toBe('12/12/2014')
  expect(formatDate('2000-1-2')).toBe('01/02/2000')
  expect(formatDate('dsfgdsfg')).toBe('Invalid Date')
  expect(formatDate(3423434 as any)).toBe('01/01/1970')
})

test('formatMonthShort formats short date correctly', () => {
  setLocale(LOCALE_CODE.RU)
  expect(formatMonthShort(2)).toBe('Фев')
  expect(formatMonthShort(2, LOCALE_CODE.EN_US)).toBe('Feb')
  expect(formatMonthShort('01.01.2000')).toBe('Янв')
})

test('formatMonthShort throws errors on invalid parameters', () => {
  setLocale(LOCALE_CODE.RU)
  const errorMessage = (v: string | number) => `formatMonthShort: incorrect value '${v}'! Expected string with date or number from 1 to 12!`
  expect(() => formatMonthShort(14)).toThrowError(errorMessage(14))
  expect(() => formatMonthShort(0)).toThrowError(errorMessage(0))
  expect(() => formatMonthShort('стинга')).toThrowError(errorMessage('стинга'))
})
