import { Schema as Sc } from 'effect'

import { OrganizationIdSchema } from './OrganizationId'

export const OrganizationOutputDTO = Sc.Struct({
  id: OrganizationIdSchema,
  name: Sc.String
})

export type OrganizationOutputDTO = Sc.Schema.Type<typeof OrganizationOutputDTO>
