import { MemorySession, SessionRepo } from './external'

export class ReposFactory {
  constructor(private _memorySession: MemorySession) {}

  private _sessionRepo: SessionRepo | undefined

  get sessionRepo() {
    if (!this._sessionRepo) {
      this._sessionRepo = new SessionRepo(this._memorySession)
    }

    return this._sessionRepo!
  }
}
