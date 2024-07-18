import * as Sc from '@effect/schema/Schema'

import { OrganizationIdSchema } from './OrganizationId'

export const OrganizationOutputDTO = Sc.Struct({
  id: OrganizationIdSchema,
  name: Sc.String
})

export type OrganizationOutputDTO = Sc.Schema.Type<typeof OrganizationOutputDTO>
