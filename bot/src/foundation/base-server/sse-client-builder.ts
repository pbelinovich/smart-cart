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
  connect: () => Promise<void>
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
  let timeout: any

  return {
    baseUrl,
    eventsUrl,
    onEvent,
    statusObserver,
    connectionIdObserver,
    connect: () => {
      let resolved = false

      return new Promise((resolve, reject) => {
        statusObserver.trigger('CONNECTING')
        eventSource = new EventSource(url)

        eventSource.onopen = () => {
          statusObserver.trigger('CONNECTED')
        }

        unsubFromConnectionId = onEvent('connectionEstablished', (data: { id: string }) => {
          connectionIdObserver.trigger(data.id)

          if (!resolved) {
            resolved = true
            resolve()
          }
        })

        // Обработка ошибок
        eventSource.onerror = e => {
          console.log(e)
          statusObserver.trigger('DISCONNECTED')
        }

        eventSourceInterval = setInterval(() => {
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
              url: `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}events/ping?id=${connectionIdObserver.getValue()}`,
              headers: {
                [CONNECTION_ID_HEADER_NAME]: connectionIdObserver.getValue(),
              },
            })
          }
        }, 1000 * 30 /*  30 seconds */)

        timeout = setTimeout(() => {
          if (!resolved) {
            reject(new Error('Timeout'))
          }
        }, 1000 * 20)
      })
    },
    disconnect: () => {
      clearTimeout(timeout)
      clearInterval(pingInterval)
      clearInterval(eventSourceInterval)
      if (unsubFromConnectionId) unsubFromConnectionId()
      if (eventSource) {
        eventSource.close()
        eventSource = undefined
        statusObserver.trigger('DISCONNECTED')
      }
    },
  }
}
