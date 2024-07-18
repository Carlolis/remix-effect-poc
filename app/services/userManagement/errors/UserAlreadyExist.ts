import { TaggedClass } from 'effect/Data'

export class UserAlreadyExist extends TaggedClass('UserAlreadyExist')<{ error: unknown }> {
  override toString!: never
  static of = (error: unknown): UserAlreadyExist => new UserAlreadyExist({ error })

  toStringError = (): string => `UserAlreadyExist: ${this.error}`
}
