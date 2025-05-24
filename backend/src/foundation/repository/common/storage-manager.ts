import { DataBaseEventHandler, IStorageManager, ISession, BaseDbEvent } from '../types'

export abstract class StorageManager<TSession extends ISession<any>, TEvents extends BaseDbEvent = BaseDbEvent>
  implements IStorageManager<TSession, TEvents>
{
  private subs: DataBaseEventHandler<TEvents>[] = []
  abstract createSession: () => TSession

  subscribe = (sub: DataBaseEventHandler<TEvents>) => {
    this.subs.push(sub)

    return () => {
      this.subs = this.subs.filter(x => x !== sub)
    }
  }

  trigger = (event: TEvents) => {
    this.subs.forEach(x => x(event))
  }
}
