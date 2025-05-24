import {
  ChannelEvent,
  ChannelSub,
  HTTPRequest,
  IChannelCreateResponse,
  IChannelDiffUpdateResponse,
  IChannelInitialResponse,
  IChannelStoreItem,
  IChannelUpdateResponse,
  IDataValidator,
} from './types'
import { BaseDbEvent, IReadOnlyRepo } from '../repository'
import { Express } from 'express'
import { logError } from '../logger'
import { compare } from 'fast-json-patch'
import { QueueMaster } from './queue-master'
import { ValidationRequestDataError } from './errors'
import { defaultErrorMapper } from './common'
import { ShutdownManager } from '../shutdown-manager'
import { IEventBus } from '../event-bus'
import { guid, CONNECTION_ID_HEADER_NAME } from '@shared'

const BROWSER_ID_COOKIE_NAME = 'browser_id'

export interface IConnectionStoreItem {
  id: string
  browserId: string
  channels: {
    [id: string]: IChannelStoreItem<any, any>
  }
  sendEvent: (eventName: string, data: any) => void
  isAlive: boolean
  closeConnection: () => void
  lastPingDateUnix: number
}

export class ChannelsManager<TEvents extends BaseDbEvent> {
  connections: { [id: string]: IConnectionStoreItem } = {}

  private subs: ChannelSub[] = []

  constructor(
    protected eventBus: IEventBus<TEvents>,
    protected errorMapper: (err: any) => {
      status: number
      body: string
    } = defaultErrorMapper
  ) {
    setInterval(() => {
      Object.keys(this.connections).forEach(id => {
        if (this.connections[id].lastPingDateUnix < Date.now() - 1000 * 120 /* 2 minutes */) {
          this.closeConnection(id)
        }
      })
    }, 1000 * 20 /* 20 seconds */)
  }

  subscribe = (sub: ChannelSub) => {
    this.subs.push(sub)

    return () => {
      this.subs = this.subs.filter(x => x !== sub)
    }
  }

  trigger = (event: ChannelEvent) => {
    this.subs.forEach(sub => {
      try {
        sub(event)
      } catch (e) {
        logError(e)
      }
    })
  }

  createChannel = async <TResult>(
    connectionId: string,
    paramsIn: any,
    paramsValidator: IDataValidator<any>,
    getHandler: (onUseRepo: (repo: IReadOnlyRepo<any>) => void) => (params: any) => Promise<TResult>,
    eventFilterMapper: (params: any) => object | undefined
  ): Promise<IChannelCreateResponse<TResult>> => {
    const connection = this.connections[connectionId]

    if (!connection || !connectionId.startsWith(connection.browserId)) {
      throw new Error('Unable to find active SSE connection or connection related with other browser')
    }
    const channelId = guid()

    let usedCollections: { [key: string]: true } = {}

    const execute = (params: any) => {
      usedCollections = {}
      const handler = getHandler(repo => {
        usedCollections[repo.collectionName] = true
      })
      return handler(params)
    }

    const queue = new QueueMaster()

    const recalculate = () => {
      // TODO тут надо хорошенько подумать как быть, так как асинхронная очередь
      // не очень подходит, тут нужно скорее что-то типа дебоунсера с последующим вызовом если
      // во время его выполнения были еще обновления
      return queue.enqueue(async () => {
        try {
          const revision = connection.channels[channelId].revision
          const params = connection.channels[channelId].params
          const result = await execute(params)
          if (!connection.isAlive || !connection.channels[channelId] || connection.channels[channelId].revision !== revision) {
            return
          }

          const prevResult = connection.channels[channelId].lastResult
          const updateLastData = (data: any) => {
            connection.channels[channelId].lastResult = data
            connection.channels[channelId].revision++
          }
          if ((typeof result === 'object' && result !== null) || Array.isArray(result)) {
            const diff = compare(prevResult, result)
            if (diff.length !== 0) {
              const data: IChannelDiffUpdateResponse = {
                diff,
                channelId,
                revision,
              }
              connection.sendEvent('channelUpdateDiff', data)
              updateLastData(result)
            }
          } else if (prevResult !== result) {
            connection.channels[channelId].revision++
            const data: IChannelUpdateResponse = {
              result,
              channelId,
              revision,
            }
            connection.sendEvent('channelUpdate', data)
            updateLastData(result)
          }
        } catch (e) {
          logError(e)
        }
      })
    }

    const eventBusUnsub = this.eventBus.subscribe(ev => {
      if (!usedCollections[ev.entity] || !connection.channels[channelId]) {
        return
      }

      const params = connection.channels[channelId].params
      const filter = eventFilterMapper(params)

      const entity = ev.event.entity
      if (filter && Object.keys(filter).some((key: any) => entity[key] !== (filter as any)[key])) {
        return
      }
      recalculate()
    })

    const result = await execute(paramsIn)

    connection.channels[channelId] = {
      id: channelId,
      revision: 0,
      params: paramsIn,
      getHandler,
      destroy: () => eventBusUnsub(),
      recalculate,
      lastResult: result,
      paramsValidator,
    }

    return {
      channelId,
      result,
    } as IChannelInitialResponse
  }

  extractBrowserIdFromRequest = (req: HTTPRequest) => {
    const result = req.cookies[BROWSER_ID_COOKIE_NAME] as string | undefined

    if (!result) {
      throw new Error('Unable to extract browser id from request!')
    }

    return result
  }

  extractConnectionIdFromRequest = (req: HTTPRequest) => {
    let result = req.header(CONNECTION_ID_HEADER_NAME)

    if (!result) {
      result = req.query['__connectionId'] as string
      if (!result) {
        throw new Error('Unable to extract connection id from request!')
      }
    }

    return result
  }

  appendSSEHandlerToExpress = (expressApp: Express) => {
    // для дебага, пока оставил, может еще пригодиться
    /*setInterval(() => {
      logInfo('connections', Object.keys(this.connections).length)
      Object.keys(this.connections).forEach((key, index) => {
        logInfo('channels in connection', index, Object.keys(this.connections[key].channels).length)
      })
    }, 5000)
    */
    expressApp.get('/events/destroy', (req, res) => {
      const id = req.query['id']

      if (typeof id !== 'string' || !id) {
        res.status(400).write('Bad request')
        return
      }

      let connectionId: string | undefined

      try {
        connectionId = this.extractConnectionIdFromRequest(req)
      } catch (e) {
        res.status(400).write('Bad request. Connection id is not specified!')
        return
      }

      if (!this.connections[connectionId]) {
        res.status(404).write('Connection is not found!')
        return
      }

      if (!this.connections[connectionId].channels[id]) {
        res.status(404).write('Channel is not found!')
        return
      }

      const channel = this.connections[connectionId].channels[id]
      delete this.connections[connectionId].channels[id]
      channel.destroy()
      res.status(200).json({ success: true })
    })

    expressApp.get('/events/ping', (req, res) => {
      const id = req.query['id']

      if (typeof id !== 'string' || !id) {
        res.status(400).write('Bad request')
        return
      }

      if (!this.connections[id]) {
        res.status(404).write('Connection is not found!')
        return
      }

      this.connections[id].lastPingDateUnix = Date.now()
      res.status(200).write('OK', () => {
        res.end()
      })
    })

    expressApp.post('/events/updateParams', async (req, res) => {
      const id = req.query['id']

      if (typeof id !== 'string' || !id) {
        res.status(400).write('Bad request')
        return
      }

      const connectionId = this.extractConnectionIdFromRequest(req)
      if (!connectionId) {
        res.status(400).write('Bad request. Connection id is not specifyed!')
        return
      }

      if (!this.connections[connectionId]) {
        res.status(404).write('Connection is not found!')
        return
      }

      if (!this.connections[connectionId].channels[id]) {
        res.status(404).write('Channel is not found!')
        return
      }
      const channel = this.connections[connectionId].channels[id]

      try {
        const data = req.body
        const validationResult = channel.paramsValidator.validate(data)
        if (validationResult) {
          throw new ValidationRequestDataError(400, validationResult)
        }

        channel.params = data

        await channel.recalculate()
        return res.status(200).json({ success: true })
      } catch (e) {
        logError(`The following error occured diring updating channel's params:`, e)
        const errData = this.errorMapper(e)
        return res.status(errData.status).send(errData.body)
      }
    })

    expressApp.get('/events', (req, res) => {
      let id = 0
      let browserId: string

      try {
        browserId = this.extractBrowserIdFromRequest(req)
      } catch (e) {
        browserId = guid()
      }

      res.cookie(BROWSER_ID_COOKIE_NAME, browserId)

      const connectionId = `${browserId}-${guid()}`

      // Устанавливаем заголовки для SSE
      const headers = {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      }
      res.writeHead(200, headers)

      const sendEvent = (eventName: string, data: any) => {
        id++
        res.write(`id: ${id}\n`)
        res.write(`event: ${eventName}\n`)
        res.write(`data: ${JSON.stringify(data)}\n\n`)
        res.flush()
      }

      // Реализация Heartbeat (каждые 15 секунд)
      const heartbeatInterval = setInterval(() => {
        sendEvent('heartbeat', { timestamp: new Date().toISOString() })
      }, 15000)

      const closeConnection = () => {
        this.trigger({ kind: 'close', connectionId })
        clearInterval(heartbeatInterval)
        res.end()
        process.off('SIGINT', closeConnection)
        if (this.connections[connectionId]) {
          Object.values(this.connections[connectionId].channels).forEach(channel => {
            channel.destroy()
          })
          this.connections[connectionId].isAlive = false
          delete this.connections[connectionId]
        }
      }

      // Обрабатываем закрытие соединения
      req.on('close', closeConnection)

      this.connections[connectionId] = {
        id: connectionId,
        browserId,
        channels: {},
        sendEvent,
        isAlive: true,
        closeConnection,
        lastPingDateUnix: Date.now(),
      }

      sendEvent('connectionEstablished', { id: connectionId })
      this.trigger({ kind: 'open', browserId, connectionId, req })
    })

    // это хак нужен для корректного завершения всех открытых соединений если вырубаем сервак
    // без этого если юзается прокси соединения могут зависать на клиенте

    ShutdownManager.addTask(() => {
      Object.keys(this.connections).forEach(k => {
        this.connections[k].closeConnection()
      })
      return new Promise(r => {
        setTimeout(() => {
          r()
        }, 16)
      })
    })
  }

  closeConnection = (connectionId: string) => {
    if (!this.connections[connectionId]) {
      return
    }

    this.connections[connectionId].closeConnection()
  }

  send = (connectionId: string, eventName: string, data: any) => {
    if (!this.connections[connectionId]) {
      throw new Error('Connection is missing!')
    }

    this.connections[connectionId].sendEvent(eventName, data)
  }
}
