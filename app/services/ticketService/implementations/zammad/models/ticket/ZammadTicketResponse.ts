/* eslint-disable @typescript-eslint/naming-convention */
import { pipe, Schema as Sc } from 'effect'
import { StringFromStringOrNumber } from '~/services/StringFromStringOrNumber'

export const ZammadTicketIdBrand = Symbol('ZammadTicketId')

export const ZammadTicketId = pipe(
  StringFromStringOrNumber,
  Sc.brand(ZammadTicketIdBrand)
)

/**
 * @param id ticketId
 * @param title title
 */
export const ZammadTicketResponse = Sc.Struct({
  id: ZammadTicketId,
  group_id: Sc.Number,
  priority_id: Sc.Number,
  state_id: Sc.Number,
  organization_id: Sc.NullOr(Sc.Number),
  number: Sc.String,
  title: Sc.String,
  owner_id: Sc.Number,
  customer_id: Sc.Number,
  create_article_type_id: Sc.Number,
  create_article_sender_id: Sc.Number,
  article_count: Sc.Number,
  updated_by_id: Sc.Number,
  created_by_id: Sc.Number,
  created_at: Sc.DateFromString,
  updated_at: Sc.DateFromString,
  article_ids: Sc.optional(Sc.Array(Sc.Number))
})

export type ZammadTicketResponse = Sc.Schema.Type<typeof ZammadTicketResponse>
