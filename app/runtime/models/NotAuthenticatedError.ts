import { Data } from 'effect';



export class NotAuthenticated extends Data.TaggedError("NotAuthenticated")<{ message: string }> {
  static of = (message: string): NotAuthenticated =>
    new NotAuthenticated({ message })
}