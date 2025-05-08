import { ServerError } from './errors'

export const defaultErrorMapper = (err: any) => {
  if (err instanceof ServerError) {
    return {
      status: err.status,
      body: err.text,
    }
  }

  return {
    status: 500,
    body: 'Internal server error',
  }
}
