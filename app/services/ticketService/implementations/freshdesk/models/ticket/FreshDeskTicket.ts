import { Schema as Sc } from 'effect'

/**
 * @param name customer's name
 * @param email customer's email
 * @param subject ticket's title
 * @param description ticket's message
 * @param status ticket's status
 * @param priority ticket's priority
 * @param type ticket's type
 * @param requester_id requester's ID
 */
export const FreshDeskTicket = Sc.Struct({
  name: Sc.String,
  email: Sc.String,
  subject: Sc.String,
  description: Sc.String,
  status: Sc.Literal(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13),
  priority: Sc.Literal(1, 2, 3, 4),
  type: Sc.NullOr(Sc.String),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  requester_id: Sc.optional(Sc.Number)
})

export type FreshDeskTicket = Sc.Schema.Type<typeof FreshDeskTicket>
