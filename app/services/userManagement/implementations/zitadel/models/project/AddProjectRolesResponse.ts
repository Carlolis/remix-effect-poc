import * as Sc from '@effect/schema/Schema'

export const AddProjectRolesResponse = Sc.Struct({
  details: Sc.Struct({ changeDate: Sc.optional(Sc.DateFromSelf), resourceOwner: Sc.String })
})
