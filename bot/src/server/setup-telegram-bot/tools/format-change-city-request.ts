import { IChangeCityRequestEntity, ChangeCityRequestStatus } from '@server'
import { html } from 'teleform'
import { Markup } from 'telegraf'
import { ISendMessageOptions } from '../common'

export interface IFormatChangeCityRequestResult {
  message: string
  options?: ISendMessageOptions
}

type StatusToFormatterMap = Record<
  ChangeCityRequestStatus,
  (changeCityRequest: IChangeCityRequestEntity) => IFormatChangeCityRequestResult | string
>

const statusToFormatterMap: StatusToFormatterMap = {
  created: changeCityRequest => {
    if (changeCityRequest.error) {
      return 'Упс! Произошла ошибка во время создания запроса на смену города. Повтори попытку, пж'
    }

    return '☑️ Создал запрос на смену города. Ожидай, бро'
  },
  citiesSearching: changeCityRequest => {
    if (changeCityRequest.error) {
      return 'Упс! Произошла ошибка во время поиска городов. Повтори попытку, пж'
    }

    return '🕓 Ищу города...'
  },
  citiesFound: changeCityRequest => {
    if (!changeCityRequest.cities.length) {
      return '🤖 Я не нашел ни одного города, попробуй по-другому'
    }

    if (changeCityRequest.error) {
      return 'Упс! Произошла ошибка после того, как я нашел города. Повтори попытку, пж'
    }

    const cities = changeCityRequest.cities.map(city => city.name)
    const replyMarkup = Markup.keyboard(cities).oneTime().resize()

    return { message: '⬇ Выбери город', options: { replyMarkup } }
  },
  citySelected: changeCityRequest => {
    if (changeCityRequest.error) {
      return 'Упс! Произошла ошибка во время выбора города. Повтори попытку, пж'
    }

    return '🕓 Запоминаю...'
  },
  chercherAreaGetting: changeCityRequest => {
    if (changeCityRequest.error) {
      return 'Упс! Произошла ошибка после того, как был выбран город. Повтори попытку, пж'
    }

    return '🕓 Еще запрашиваю пару метаданных...'
  },
  userCityUpdated: changeCityRequest => {
    if (changeCityRequest.error) {
      return 'Упс! Произошла ошибка на финальной стадии выбора города. Повтори попытку, пж'
    }

    const selectedCity = changeCityRequest.cities.find(city => city.id === changeCityRequest.selectedCityId)

    return `✅ Установил город${selectedCity ? ` ${html.bold(selectedCity.name)}` : ''}`
  },
  canceledByUser: () => {
    return '❌ Выбор города отменен'
  },
}

export const formatChangeCityRequest = (changeCityRequest: IChangeCityRequestEntity): IFormatChangeCityRequestResult | undefined => {
  const format = statusToFormatterMap[changeCityRequest.status]

  if (!format) {
    return
  }

  const result = format(changeCityRequest)

  return typeof result === 'string' ? { message: result } : result
}
