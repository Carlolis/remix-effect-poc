import * as Sc from '@effect/schema/Schema'

import { CustomerIdSchema } from './CustomerId'

export const CustomerOutputDTO = Sc.Struct({
  customerId: CustomerIdSchema,
  organisationId: Sc.NullOr(Sc.Number)
})

export type CustomerOutputDTO = Sc.Schema.Type<typeof CustomerOutputDTO>
