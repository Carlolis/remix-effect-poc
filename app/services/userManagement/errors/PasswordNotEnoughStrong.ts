import { TaggedClass } from 'effect/Data'

export class PasswordNotEnoughStrong
  extends TaggedClass('PasswordNotEnoughStrong')<{ error: unknown }> {
  override toString!: never
  static of = (error: unknown): PasswordNotEnoughStrong => new PasswordNotEnoughStrong({ error })

  toStringError = (): string => `PasswordNotEnoughStrong: ${this.error}`
}
