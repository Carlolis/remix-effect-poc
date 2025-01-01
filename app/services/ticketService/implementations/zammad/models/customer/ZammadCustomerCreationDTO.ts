/* eslint-disable @typescript-eslint/naming-convention */
import { Schema as Sc } from 'effect'

/**
 * @param login customer's userName
 */
export const ZammadCustomerCreationDTO = Sc.Struct({
  firstName: Sc.String,
  lastName: Sc.String,
  login: Sc.String,
  email: Sc.String,
  organization: Sc.optional(Sc.String),
  roles: Sc.Array(Sc.Literal('Admin', 'Agent', 'Customer'))
})

export type ZammadCustomerCreationDTO = Sc.Schema.Type<typeof ZammadCustomerCreationDTO>
