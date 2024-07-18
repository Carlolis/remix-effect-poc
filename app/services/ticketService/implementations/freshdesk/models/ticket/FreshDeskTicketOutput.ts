import * as Sc from '@effect/schema/Schema'
import { SchemaPrimitives } from '@rebaze-fr/util-effect-utils-next'
import { pipe } from 'effect'

export const FreshDeskTicketIdBrand = Symbol('FreshDeskTicketId')

export const FreshDeskTicketId = pipe(
  SchemaPrimitives.StringFromStringOrNumber,
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
