import * as Sc from '@effect/schema/Schema'

export const ZitadelCreateProject = Sc.Struct({
  name: Sc.String,
  projectRoleAssertion: Sc.Boolean,
  projectRoleCheck: Sc.Boolean,
  hasProjectCheck: Sc.Boolean,
  privateLabelingSetting: Sc.optional(Sc.String)
})

export type ZitadelCreateProject = Sc.Schema.Type<typeof ZitadelCreateProject>
