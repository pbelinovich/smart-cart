/**
 * этот файл сделан по нескольким причинам
 * 1. что бы не было проблем когда пакет ui затягивают как зависимость.
 * Если юзать dayjs напрямую то компилятор не видит поделюченые плагины и ругается.
 * решением стало использование одного файла в котором подклюаются все плагины, а все файлы проекта используют данный инстанс
 * 2. в будущем возможно будет еше более общий экземпял dayjs или другой библиотеки, так проще будет подменить ее использование в проекте
 */
import { MONTH_SHORT } from './constants'
import { IConfig } from './interfaces'
import { LOCALE_CODE } from './constants'

import dayjs, { Dayjs } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isBetween from 'dayjs/plugin/isBetween'
import utc from 'dayjs/plugin/utc'

dayjs.extend(localizedFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(isBetween)
dayjs.extend(utc)
dayjs.extend(customParseFormat)

export { default as localizedFormat } from 'dayjs/plugin/localizedFormat'
export { default as isSameOrAfter } from 'dayjs/plugin/isSameOrAfter'
export { default as customParseFormat } from 'dayjs/plugin/customParseFormat'
export { default as isSameOrBefore } from 'dayjs/plugin/isSameOrBefore'
export { default as isBetween } from 'dayjs/plugin/isBetween'
export { default as utc } from 'dayjs/plugin/utc'

const config: IConfig = {
  locale: '',
}

/**
 * Возвращает строку с отформатированной датой в зависимости от текущего состояния dayjs.
 * @param {string} dateStr строка для форматирования
 * @example
 * // return 12.12.2014
 * formatDate('2014-12-12')
 * @return {string} строка с отформатированной датой в зависимости от текущего состояния dayjs
 */
export const formatDate = (dateStr: string) => {
  if (!dateStr) {
    return ''
  }
  return dateTime(dateStr).format('L')
}

/**
 * Возвращает короткое наименование месяца
 * @param {number | string} val - дата или номер месяца
 * @param {string} locale локаль для форматирования
 */
export const formatMonthShort = (val: number | string, locale: string = getLocale()): string => {
  if (
    !['string', 'number'].includes(typeof val) ||
    (!(typeof val === 'number' && val >= 1 && val <= 12) && !(typeof val === 'string' && dateTime(val).isValid()))
  ) {
    throw new Error(`formatMonthShort: incorrect value '${val}'! Expected string with date or number from 1 to 12!`)
  }
  let month: number
  if (typeof val === 'string') {
    const date = dateTime(val)
    month = date.month()
  } else {
    month = val - 1
  }

  return MONTH_SHORT[locale][month] // в dayjs есть monthShort - отдаёт именно то, что нужно. Можно потом заменить
}

/**
 * Возвращает текущую локаль
 */
export const getLocale = () => (config.locale === LOCALE_CODE.EN ? LOCALE_CODE.EN_US : config.locale)

/**
 * Устанавливает язык
 * @param locale язык
 */
export const setLocale = (locale: string) => {
  if (!locale) {
    throw new Error(`setLocale: locale have to be defined but got ${locale}`)
  }
  if (locale === LOCALE_CODE.EN_US) {
    locale = LOCALE_CODE.EN
  }
  config.locale = locale
  ;(dateTime as any)[localeSymbol](locale)
}

const dt = dayjs
const localeSymbol = Symbol()
;(dt as any)[localeSymbol] = dt.locale
export const dateTime = dt
export type DateTime = Dayjs
setLocale(LOCALE_CODE.RU)
