import { IUserEntity } from '@server'

export const formatUser = (user: IUserEntity) => {
  let result = ''

  if (user.telegramFirstName) {
    result += user.telegramFirstName
  } else if (user.telegramLogin) {
    result += user.telegramLogin
  }

  return result.trim()
}
