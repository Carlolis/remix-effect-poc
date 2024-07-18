import { TaggedClass } from 'effect/Data'

export class ServerError extends TaggedClass('ServerError')<{ error: unknown }> {
  override toString!: never
  static of = (error: unknown): ServerError => new ServerError({ error })

  toStringError = (): string => `ServerError: ${this.error}`
}
