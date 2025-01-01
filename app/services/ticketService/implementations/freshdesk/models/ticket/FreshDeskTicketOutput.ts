import { pipe, Schema as Sc } from 'effect'
import { StringFromStringOrNumber } from '../../../../../StringFromStringOrNumber'

export const FreshDeskTicketIdBrand = Symbol('FreshDeskTicketId')

export const FreshDeskTicketId = pipe(
  StringFromStringOrNumber,
  Sc.brand(FreshDeskTicketIdBrand)
)

/**
 * @param id ticketId
 * @param subject title
 * @param description_text message
 * @param priority priority
 */
export const FreshDeskTicketOutput = Sc.Struct({
  id: FreshDeskTicketId,
  subject: Sc.String,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  description_text: Sc.String,
  priority: Sc.Literal(1, 2, 3, 4)
})

export type FreshDeskTicketOutput = Sc.Schema.Type<typeof FreshDeskTicketOutput>
