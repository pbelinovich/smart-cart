export interface IEventBus<TEvents> {
  subscribe: (callback: (event: TEvents) => void) => () => void
  sendEvent: (event: TEvents) => void
}

export class EventBus<TEvents> implements IEventBus<TEvents> {
  protected subs: Array<(event: TEvents) => void> = []

  subscribe = (callback: (event: TEvents) => void) => {
    this.subs.push(callback)
    return () => {
      this.subs = this.subs.filter(x => x !== callback)
    }
  }

  sendEvent = (event: TEvents) => {
    this.subs.forEach(x => x(event))
  }
}
