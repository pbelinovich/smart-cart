import axios from 'axios'
import { EventSource } from 'eventsource'
import { CONNECTION_ID_HEADER_NAME, createObserver, Observer } from '@shared'

export type SseStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'
export type SseClient = {
  baseUrl: string
  eventsUrl: string
  onEvent: <TData>(systemEventName: string, sub: (data: TData) => void) => () => void
  statusObserver: Observer<SseStatus>
  connectionIdObserver: Observer<string | undefined>
  connect: () => void
  disconnect: () => void
}

export const buildSseClient = (baseUrl: string, eventsUrl: string): SseClient => {
  const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}${eventsUrl}`

  const statusObserver = createObserver<SseStatus>('CONNECTED')
  const connectionIdObserver = createObserver<string | undefined>(undefined)

  let eventSource: EventSource | undefined
  let unsubFromConnectionId: (() => void) | undefined

  const onEvent = <TData>(name: string, sub: (data: TData) => void) => {
    const localEventSource = eventSource

    if (!localEventSource) {
      throw new Error('Enable to subscribe to eventSource, it is not ready or closed')
    }

    const handler = (event: any) => {
      sub(JSON.parse(event.data))
    }

    localEventSource.addEventListener(name, handler)

    return () => {
      localEventSource.removeEventListener(name, handler)
    }
  }

  let eventSourceInterval: any
  let pingInterval: any

  return {
    baseUrl,
    eventsUrl,
    onEvent,
    statusObserver,
    connectionIdObserver,
    connect: () => {
      statusObserver.trigger('CONNECTING')
      eventSource = new EventSource(url)

      eventSource.addEventListener('open', () => {
        console.log('!!', 'open')
        statusObserver.trigger('CONNECTED')
      })

      eventSource.addEventListener('message', m => {
        console.log('!!', 'message', m)
      })

      eventSource.addEventListener('error', e => {
        console.log('!!', 'err')
        console.log(e)
        statusObserver.trigger('DISCONNECTED')
        eventSource = undefined
      })

      // eventSource.onopen = () => {}

      unsubFromConnectionId = onEvent('connectionEstablished', (data: { id: string }) => {
        console.log('!!', 'connectionEstablished')
        connectionIdObserver.trigger(data.id)
      })

      // Обработка ошибок
      // eventSource.onerror = e => {}

      eventSourceInterval = setInterval(() => {
        // console.log('!!eventSource3', eventSource)
        if (eventSource) {
          if (eventSource.readyState === 0) {
            statusObserver.trigger('CONNECTING')
          } else if (eventSource.readyState === 2) {
            statusObserver.trigger('DISCONNECTED')
            eventSource = undefined
          } else {
            statusObserver.trigger('CONNECTED')
          }
        }
      }, 1000)

      pingInterval = setInterval(() => {
        if (statusObserver.getValue() === 'CONNECTED') {
          axios({
            url: `${url}${url.endsWith('/') ? '' : '/'}ping?id=${connectionIdObserver.getValue()}`,
            headers: {
              [CONNECTION_ID_HEADER_NAME]: connectionIdObserver.getValue(),
            },
          })
        }
      }, 1000 * 30 /*  30 seconds */)
    },
    disconnect: () => {
      console.log('!!', 'disconnect')
      clearInterval(eventSourceInterval)
      clearInterval(pingInterval)
      if (unsubFromConnectionId) unsubFromConnectionId()
      if (eventSource) {
        eventSource.close()
        eventSource = undefined
        statusObserver.trigger('DISCONNECTED')
      }
    },
  }
}
