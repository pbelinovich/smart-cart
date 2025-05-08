import { guid } from './object-utils'

export interface ISocket {
  onReceiveMessage: (callback: (data: string) => void) => void
  postMessage: (message: any) => void
}

export interface IMessage<T> {
  type: string
  data?: T
  id?: string
  accessToken?: string
}

type Handler = (data: any, id?: string) => void | Promise<void>

export const message = <T>(type: T, data?: any, id?: string, accessToken?: string) => {
  return JSON.stringify({ type, data, id, accessToken })
}

export class MessagesBasedCommunicator<TReq extends string, TMessageType extends string> {
  constructor(public socket: ISocket) {
    socket.onReceiveMessage(async event => {
      const data = JSON.parse(event) as IMessage<any>

      if (!data) {
        throw new Error(`Was received an invalid message: ${data}`)
      }

      if (!data.type) {
        throw new Error(`Was received an invalid type of message: ${data.type}`)
      }

      const requestHandler = this.requestHandlers[data.type]

      if (requestHandler && data.id) {
        try {
          const resp = await requestHandler(data.data)
          this.send('REQUEST_RESPONSE', resp, data.id)
        } catch (e: any) {
          this.send('ERROR', { message: e.message }, data.id)
        }
        return
      }

      const handler = this.handlers[data.type]

      if (!handler) {
        return
      }

      const promises = Array.from(handler).map(hdl => {
        const result = hdl(data.data, data.id)

        return result instanceof Promise ? result : Promise.resolve(result)
      })

      return Promise.all(promises)
    })
  }

  private handlers: {
    [key: string]: Handler[]
  } = {}

  private requestHandlers: {
    [key: string]: (data: any) => Promise<any>
  } = {}

  public request = <T>(type: TReq, data?: any): Promise<T> => {
    const id = guid()

    return new Promise((resolve, reject) => {
      const unsub = this.on('REQUEST_RESPONSE', (data, respId) => {
        if (respId === id) {
          unsub()
          errUnsub()
          resolve(data)
        }
      })

      const errUnsub = this.on('ERROR', (data, respId) => {
        if (respId === id) {
          unsub()
          errUnsub()
          reject(data)
        }
      })

      this.send(type as any, data, id)
    })
  }

  send = (type: string, data?: any, id?: string) => {
    return this.socket.postMessage(message(type as any, data, id))
  }

  on = (type: TMessageType | 'REQUEST_RESPONSE' | 'ERROR', handler: (data: any, id?: string) => void) => {
    this.handlers[type] = this.handlers[type] || []
    this.handlers[type].push(handler)

    return () => {
      this.handlers[type] = this.handlers[type].filter(x => x !== handler)
    }
  }

  setRequestHandler = (type: TReq, handler: (data: any) => any) => {
    this.requestHandlers[type] = handler
  }
}
