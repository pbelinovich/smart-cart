export class SubscriptionManager {
  private subscriptions = new Map<
    number,
    {
      unsub: () => Promise<any> | any
      destroy: () => Promise<any> | any
    }[]
  >()

  add = (chatId: number, subscription: { unsub: () => Promise<any> | any; destroy: () => Promise<any> | any }) => {
    const existing = this.subscriptions.get(chatId) || []
    this.subscriptions.set(chatId, [...existing, subscription])
  }

  cleanup = async (chatId: number) => {
    const subs = this.subscriptions.get(chatId) || []

    await Promise.all(
      subs.map(async sub => {
        await sub.unsub()
        await sub.destroy()
      })
    )

    this.subscriptions.delete(chatId)
  }
}
