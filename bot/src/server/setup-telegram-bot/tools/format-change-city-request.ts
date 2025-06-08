import { IChangeCityRequestEntity, ChangeCityRequestStatus } from '@server'
import { html } from 'teleform'
import { Markup } from 'telegraf'
import { chunkArray } from './chunk-array'
import { formatError } from './format-error'
import { MessageInfo } from '../message-manager'

type StatusToFormatterMap = { [key in ChangeCityRequestStatus]?: (changeCityRequest: IChangeCityRequestEntity) => MessageInfo | string }

const statusToFormatterMap: StatusToFormatterMap = {
  created: changeCityRequest => {
    if (changeCityRequest.error) {
      return formatError('Произошла ошибка во время создания запроса на смену города')
    }

    return '☑️ Создал запрос на смену города. Ожидай, бро'
  },
  citiesSearching: changeCityRequest => {
    if (changeCityRequest.error) {
      return formatError('Произошла ошибка во время поиска городов')
    }

    return { message: '🕓 Ищу города...', options: { kind: 'edit' } }
  },
  citiesFound: changeCityRequest => {
    if (!changeCityRequest.cities.length) {
      return '🤖 Я не нашел ни одного города, попробуй по-другому'
    }

    if (changeCityRequest.error) {
      return formatError('Произошла ошибка во время выбора города')
    }

    const cities = chunkArray(changeCityRequest.cities, 2)
    const toMarkup = cities.map(item => item.map(city => Markup.button.callback(city.name, `selectCity/${city.id}`)))

    toMarkup.push([Markup.button.callback('❌ Отменить', 'cancel')])

    return {
      message: '⬇ Выбери город',
      options: {
        kind: 'edit',
        markup: Markup.inlineKeyboard(toMarkup),
      },
    }
  },
  citySelected: changeCityRequest => {
    if (changeCityRequest.error) {
      return formatError('Произошла ошибка во время выбора города')
    }

    return { message: '🕓 Запоминаю...', options: { kind: 'edit' } }
  },
  chercherAreaGetting: changeCityRequest => {
    if (changeCityRequest.error) {
      return formatError('Произошла ошибка после того, как был выбран город')
    }

    return { message: '🕓 Еще запрашиваю пару метаданных...', options: { kind: 'edit' } }
  },
  userCityUpdated: changeCityRequest => {
    if (changeCityRequest.error) {
      return formatError('Произошла ошибка на финальной стадии выбора города')
    }

    const selectedCity = changeCityRequest.cities.find(city => city.id === changeCityRequest.selectedCityId)

    return {
      message: `✅ Установил город${selectedCity ? ` ${html.bold(selectedCity.name)}` : ''}`,
      options: { kind: 'edit' },
    }
  },
}

export const formatChangeCityRequest = (changeCityRequest: IChangeCityRequestEntity): MessageInfo | undefined => {
  const format = statusToFormatterMap[changeCityRequest.status]

  if (!format) {
    return
  }

  const result = format(changeCityRequest)

  return typeof result === 'string' ? { message: result } : result
}
