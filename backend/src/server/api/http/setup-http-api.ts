import { publicHttpApi } from './api'
import { OperationExecutionError } from '@shared'
import {
  EntityNotFoundError,
  appendApiDomainToExpress,
  defaultErrorMapper,
  logError,
  EntityIsNotUniqueError,
  ChannelsManager,
} from '../../external'
import { SetupHttpApiParams } from './types'

const errorMapper = (errorIn: any) => {
  let error = errorIn

  logError(error)

  if (error instanceof OperationExecutionError) {
    if (error.info.kind === 'exceptionDuringExecution') {
      error = error.info.exception
    } else {
      error = error.info.validationErrors[0]!
    }
  }

  if (error instanceof EntityIsNotUniqueError) {
    return {
      status: 409,
      body: 'Невозможно создать запись, так как она не уникальна',
    }
  }

  if (error instanceof EntityNotFoundError) {
    return {
      status: 404,
      body: 'Not found',
    }
  }

  return defaultErrorMapper(error)
}

export const setupHTTPApi = ({ expressApp, app, eventBus }: SetupHttpApiParams) => {
  const channelsManager = new ChannelsManager(eventBus)

  appendApiDomainToExpress({
    expressApp,
    api: publicHttpApi,
    domainName: 'public',
    contextGetter: () => {
      const executors = app.getExecutors({})

      return {
        readExecutor: executors.readExecutor,
        writeExecutor: executors.writeExecutor,
      }
    },
    errorMapper,
    channelsManager,
  })
}
