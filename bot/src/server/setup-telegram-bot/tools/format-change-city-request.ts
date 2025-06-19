import { IChangeCityRequestEntity, ChangeCityRequestStatus } from '@server'
import { html } from 'teleform'
import { formatError } from './format-error'

type StatusToFormatterMap = { [key in ChangeCityRequestStatus]?: ((changeCityRequest: IChangeCityRequestEntity) => string) | string }

const errorStatusToFormatterMap: StatusToFormatterMap = {
  created: 'Произошла ошибка во время создания запроса на смену города',
  citiesSearching: 'Произошла ошибка во время поиска городов',
  citiesFound: 'Произошла ошибка во время выбора города',
  citySelected: 'Произошла ошибка во время выбора города',
  chercherAreaGetting: 'Произошла ошибка после того, как был выбран город',
  userCityUpdated: 'Произошла ошибка на финальной стадии выбора города',
}

const statusToFormatterMap: StatusToFormatterMap = {
  created: '☑️ Создал запрос на смену города. Ожидай, бро',
  citiesSearching: '🕓 Ищу города...',
  citySelected: '🕓 Запоминаю...',
  chercherAreaGetting: '🕓 Еще запрашиваю пару метаданных...',
  userCityUpdated: changeCityRequest => {
    const selectedCity = changeCityRequest.cities.find(city => city.id === changeCityRequest.selectedCityId)
    return `✅ Установил город${selectedCity ? ` ${html.bold(selectedCity.name)}` : ''}`
  },
}

export const formatErrorChangeCityRequest = (changeCityRequest: IChangeCityRequestEntity) => {
  const formatter = errorStatusToFormatterMap[changeCityRequest.status]

  if (!formatter) {
    return
  }

  return formatError(typeof formatter === 'function' ? formatter(changeCityRequest) : formatter)
}

export const formatChangeCityRequest = (changeCityRequest: IChangeCityRequestEntity) => {
  const formatter = statusToFormatterMap[changeCityRequest.status]

  if (!formatter) {
    return
  }

  return typeof formatter === 'function' ? formatter(changeCityRequest) : formatter
}
