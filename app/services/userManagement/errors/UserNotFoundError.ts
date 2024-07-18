import { TaggedClass } from 'effect/Data'

export class UserNotFoundError extends TaggedClass('UserNotFoundError')<{ error: unknown }> {
  override toString!: never
  static of = (error: unknown): UserNotFoundError => new UserNotFoundError({ error })

  toStringError = (): string => `UserNotFoundError: ${this.error}`
}
