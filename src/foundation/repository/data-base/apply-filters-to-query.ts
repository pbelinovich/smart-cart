import { IDocumentQuery } from 'ravendb'
import { FilterInfo, ConditionFilterInfoPredicate, LogicFilterInfoType } from '../types'

const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const PREDICATE_TO_QUERY_MAP: {
  [key in ConditionFilterInfoPredicate]: <T extends object>(query: IDocumentQuery<T>, field: string, value: any) => IDocumentQuery<T>
} = {
  eq: (query, field, value) => query.whereEquals(field, value),
  ge: (query, field, value) => query.whereGreaterThanOrEqual(field, value),
  le: (query, field, value) => query.whereLessThanOrEqual(field, value),
  ne: (query, field, value) => query.not().whereEquals(field, value),
  in: (query, field, value) => query.whereIn(field, value),
  notin: (query, field, value) => query.not().whereIn(field, value),
  gt: (query, field, value) => query.whereGreaterThan(field, value),
  lt: (query, field, value) => query.whereLessThan(field, value),
  contains: (query, field, value) => {
    // словил кейс, когда search не отрабатывал. как будто каких-то индексов не хватает.
    // начал дебажить, поставил whereRegex, потом вернул search и все заработало.
    // оставил пока whereRegex, но он тяжелее. при необходимости можно будет вернуть search
    // return query.search(field, `*${value}*`)
    return query.whereRegex(field, `(?i).*${escapeRegExp(value)}.*`)
  },
  isnull: (query, field) => query.not().whereExists(field),
  notnull: (query, field) => query.whereExists(field),
  regex: (query, field, value) => query.whereRegex(field, value),
  startsWith: (query, field, value) => query.whereStartsWith(field, value),
  endsWith: (query, field, value) => query.whereEndsWith(field, value),
  arrayContains: (query, field, value) => query.containsAny(field, Array.isArray(value) ? value : [value]),
}

const LOGIC_TO_QUERY_MAP: { [key in LogicFilterInfoType]: <T extends object>(query: IDocumentQuery<T>) => IDocumentQuery<T> } = {
  and: query => query.andAlso(),
  or: query => query.orElse(),
}

export const applyFiltersToQuery = <T extends object>(query: IDocumentQuery<T>, filterInfo: FilterInfo | undefined): IDocumentQuery<T> => {
  if (!filterInfo) return query

  if (filterInfo.type === 'condition') {
    const applyCondition = PREDICATE_TO_QUERY_MAP[filterInfo.predicate]

    if (!applyCondition) {
      throw new Error(`The predicate "${filterInfo.predicate}" is unknown!`)
    }

    return applyCondition(query, filterInfo.field, filterInfo.value)
  }

  const applyLogic = LOGIC_TO_QUERY_MAP[filterInfo.type]

  if (!applyLogic) {
    throw new Error(`The logic type "${filterInfo.type}" is unknown!`)
  }

  if (filterInfo.operands.length === 0) {
    return query
  }

  let preparedQuery = query.openSubclause()

  filterInfo.operands.forEach((operand, index) => {
    if (index > 0) {
      preparedQuery = applyLogic(preparedQuery)
    }

    preparedQuery = applyFiltersToQuery(preparedQuery, operand)
  })

  return preparedQuery.closeSubclause()
}
