import { Express, Request } from 'express'
import { Response } from 'express-serve-static-core'
import { ApiDomain, HTTPRequest, HTTPResponse } from './types'
import { ValidationRequestDataError } from './errors'
import { logError } from '../logger'
import { IQueryableRepo } from '../repository'
import { defaultErrorMapper } from './common'
import { ChannelsManager } from './channels-manager'

export type SetupExpressServerParams<TContext> = {
  contextGetter: (params: {
    request: HTTPRequest
    response: HTTPResponse
    onUseRepo?: (repo: IQueryableRepo<any>) => void
    prevContext?: TContext
  }) => TContext
  api: ApiDomain<TContext>
  domainName?: string
  expressApp: Express
  errorMapper?: (err: any) => {
    status: number
    body: string
  }
  channelsManager: ChannelsManager<any>
}

export const appendApiDomainToExpress = <TContext>({
  contextGetter,
  api,
  domainName,
  expressApp,
  errorMapper = defaultErrorMapper,
  channelsManager,
}: SetupExpressServerParams<TContext>) => {
  Object.keys(api).forEach(serviceName => {
    const handlersByKinds = api[serviceName]

    Object.keys(handlersByKinds).forEach(handlerKindIn => {
      const handlerKind = handlerKindIn as keyof ApiDomain<any>['some']
      const handlers = handlersByKinds[handlerKind]

      if (!handlers) {
        return
      }

      Object.keys(handlers).forEach(handlerName => {
        const handler = handlers[handlerName]
        const handlerUrl = `/${domainName ? `${domainName}/` : ''}${serviceName}/${handlerKind}/${handlerName}`

        const httpHandler = async (req: Request, res: Response) => {
          try {
            const dataRaw = handlerKind === 'GET' ? req.query : req.body

            // избавляемся от потенциального __connectionId системного аргумента который может быть отправлен
            // в урле гет запроса вместо заголовока
            const data = { ...dataRaw }
            delete data.__connectionId

            const validationResult = handler.validator.validate(data)

            if (validationResult) {
              throw new ValidationRequestDataError(400, validationResult)
            }

            let ctx: TContext | undefined

            const executeHandler = (onUseRepo?: (repo: any) => void) => (data: any) => {
              ctx = contextGetter({
                request: req,
                response: res,
                onUseRepo,
                prevContext: ctx,
              })

              return handler.handler(data, ctx)
            }

            const respData =
              handlerKind === 'CHANNEL'
                ? await channelsManager.createChannel(
                    channelsManager.extractConnectionIdFromRequest(req),
                    data,
                    handler.validator,
                    executeHandler,
                    (handler as any).filterMetadataMapper
                  )
                : await executeHandler()(data)

            return res.status(200).json(respData)
          } catch (e) {
            logError(`The following error occurred during handling HTTP request by URL="${handlerUrl}"`, e)
            const errData = errorMapper(e)
            res.status(errData.status).send(errData.body).end()
          }
        }

        if (handlerKind === 'GET') {
          expressApp.get(handlerUrl, httpHandler)
        } else if (handlerKind === 'POST' || handlerKind === 'CHANNEL') {
          expressApp.post(handlerUrl, httpHandler)
        }
      })
    })
  })
}
