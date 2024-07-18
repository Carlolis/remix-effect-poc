/* eslint-disable @typescript-eslint/naming-convention */
import * as Sc from '@effect/schema/Schema'

export const ProjectRole = Sc.Struct({
  key: Sc.String,
  displayName: Sc.String,
  group: Sc.optional(Sc.String)
})

export type ProjectRole = Sc.Schema.Type<typeof ProjectRole>
