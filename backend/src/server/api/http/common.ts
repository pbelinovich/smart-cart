import joi from 'joi'
import { IGetPageRequestParams, FilterInfo, ConditionFilterInfo, LogicFilterInfo } from '../../external'

type ArrayElement<T> = T extends (infer U)[] ? U : never

const FILTER_INFO_SCHEMA_ID = 'filterInfoSchema'

const conditionFilterInfoSchema = joi.object<ConditionFilterInfo>({
  type: joi.string().valid('condition'),
  field: joi.string(),
  predicate: joi.string(),
  value: joi.any(),
})

const logicFilterInfoSchema = joi.object<LogicFilterInfo>({
  type: joi.string().valid('logic'),
  operands: joi.array().items(joi.link(`#${FILTER_INFO_SCHEMA_ID}`)),
})

const filterInfoSchema = joi.alternatives<FilterInfo>(conditionFilterInfoSchema, logicFilterInfoSchema).id(FILTER_INFO_SCHEMA_ID)

export const getPageParamsSchema = joi.object<IGetPageRequestParams>({
  filter: joi.object<IGetPageRequestParams['filter']>({ data: filterInfoSchema.required() }),
  sort: joi.array().items(
    joi.object<ArrayElement<IGetPageRequestParams['sort']>>({
      field: joi.string().required(),
      direction: joi.string().valid('ASC', 'DESC').required(),
      numeric: joi.boolean(),
    })
  ),
  paging: joi.object<IGetPageRequestParams['paging']>({ offset: joi.number().required(), limit: joi.number().required() }),
})
