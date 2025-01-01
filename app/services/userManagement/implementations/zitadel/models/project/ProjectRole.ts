/* eslint-disable @typescript-eslint/naming-convention */
import { Schema as Sc } from 'effect'

export const ProjectRole = Sc.Struct({
  key: Sc.String,
  displayName: Sc.String,
  group: Sc.optional(Sc.String)
})

export type ProjectRole = Sc.Schema.Type<typeof ProjectRole>
