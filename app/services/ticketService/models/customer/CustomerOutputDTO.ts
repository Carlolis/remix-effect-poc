import { Schema as Sc } from 'effect'

import { CustomerIdSchema } from './CustomerId'

export const CustomerOutputDTO = Sc.Struct({
  customerId: CustomerIdSchema,
  organisationId: Sc.NullOr(Sc.Number)
})

export type CustomerOutputDTO = Sc.Schema.Type<typeof CustomerOutputDTO>
