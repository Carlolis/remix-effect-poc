import { Schema as Sc } from 'effect'

export const AddProjectRolesResponse = Sc.Struct({
  details: Sc.Struct({ changeDate: Sc.optional(Sc.DateFromSelf), resourceOwner: Sc.String })
})
