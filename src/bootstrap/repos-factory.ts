import { UserRepo, DataBaseSession, MemorySession, UserAddressRepo, AuthRepo } from './external'

export class ReposFactory {
  constructor(private _dbSession: DataBaseSession, private _memorySession: MemorySession) {}

  private _auth: AuthRepo | undefined
  private _user: UserRepo | undefined
  private _userAddress: UserAddressRepo | undefined

  get authRepo() {
    if (!this._auth) {
      this._auth = new AuthRepo(this._dbSession)
    }

    return this._auth!
  }

  get userRepo() {
    if (!this._user) {
      this._user = new UserRepo(this._dbSession)
    }

    return this._user!
  }

  get userAddressRepo() {
    if (!this._userAddress) {
      this._userAddress = new UserAddressRepo(this._dbSession)
    }

    return this._userAddress!
  }
}
