import { Schema as Sc } from 'effect'
import * as B from 'effect/Brand'

export type TicketId = string & B.Brand<'TicketId'>
export const TicketId = B.nominal<TicketId>()
export const TicketIdSchema = Sc.fromBrand(TicketId)(Sc.String)
