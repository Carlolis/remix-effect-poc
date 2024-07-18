import * as Sc from '@effect/schema/Schema'

import { TicketPrioritySchema } from '../commons'

export const TicketCreationDTO = Sc.Struct({
  name: Sc.String,
  title: Sc.String,
  message: Sc.String,
  priority: TicketPrioritySchema.pipe(
    Sc.propertySignature,
    Sc.withConstructorDefault(() => 'normal' as const)
  ),
  organization: Sc.optional(Sc.String),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  organization_id: Sc.optional(Sc.String),
  mapLink: Sc.optional(Sc.String)
})

export type TicketCreationDTO = Sc.Schema.Type<typeof TicketCreationDTO>
