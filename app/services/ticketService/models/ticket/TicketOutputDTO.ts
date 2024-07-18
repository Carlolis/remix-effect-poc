import * as Sc from '@effect/schema/Schema'

import { TicketPrioritySchema } from '../commons'
import { TicketId, TicketIdSchema } from './TicketId'

export const TicketOutputDTO = Sc.Struct({
  ticketId: TicketIdSchema,
  title: Sc.String,
  messages: Sc.Array(Sc.String),
  priority: TicketPrioritySchema
})

export type TicketOutputDTO = Sc.Schema.Type<typeof TicketOutputDTO>
export { TicketId }
