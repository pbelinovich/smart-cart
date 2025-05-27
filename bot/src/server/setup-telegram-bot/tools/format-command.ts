import { CommandName } from '../common'

export const formatCommand = (command: CommandName) => {
  return `/${command.toLowerCase()}`
}
