/* eslint-disable @typescript-eslint/naming-convention */
import { Schema as Sc } from 'effect'

/**
 * @param name organization's name
 */
export const ZammadOrganizationCreationDTO = Sc.Struct({
  name: Sc.String,
  shared: Sc.Boolean,
  domain: Sc.String,
  domain_assignment: Sc.Boolean,
  active: Sc.Boolean,
  vip: Sc.Boolean,
  note: Sc.String,
  members: Sc.Array(Sc.String)
})

export type ZammadOrganizationCreationDTO = Sc.Schema.Type<typeof ZammadOrganizationCreationDTO>
