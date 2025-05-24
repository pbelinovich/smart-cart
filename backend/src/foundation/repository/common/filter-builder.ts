import { ConditionFilterInfoPredicate, LogicFilterInfoType } from '../types'
import { FilterBuilder } from '../types'

const PREDICATE_MAP: { [key in ConditionFilterInfoPredicate]: ConditionFilterInfoPredicate } = {
  eq: 'eq',
  ge: 'ge',
  le: 'le',
  ne: 'ne',
  in: 'in',
  notin: 'notin',
  gt: 'gt',
  lt: 'lt',
  contains: 'contains',
  isnull: 'isnull',
  notnull: 'notnull',
  regex: 'regex',
  startsWith: 'startsWith',
  endsWith: 'endsWith',
  arrayContains: 'arrayContains',
}

const LOGIC_MAP: { [key in LogicFilterInfoType]: LogicFilterInfoType } = {
  and: 'and',
  or: 'or',
}

const predicateKeys = Object.keys(PREDICATE_MAP) as ConditionFilterInfoPredicate[]
const logicKeys = Object.keys(LOGIC_MAP) as LogicFilterInfoType[]

export const filterBuilder: FilterBuilder = {} as any

predicateKeys.forEach(predicate => {
  filterBuilder[predicate] = (field, value) => ({ type: 'condition', field, predicate, value })
})

logicKeys.forEach(type => {
  filterBuilder[type] = (...operands) => ({ type, operands })
})
