export class ServerError extends Error {
  constructor(public status: number, public text: string) {
    super(`${status}: ${text}`)
  }
}

export class ValidationRequestDataError extends ServerError {}
