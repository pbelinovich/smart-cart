import { UserRepo, DataBaseSession, MemorySession } from './external'

export class ReposFactory {
  constructor(private _dbSession: DataBaseSession, private _memorySession: MemorySession) {}

  private _user: UserRepo | undefined

  get userRepo() {
    if (!this._user) {
      this._user = new UserRepo(this._dbSession)
    }

    return this._user!
  }
}
