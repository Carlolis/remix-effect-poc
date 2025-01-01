import { Schema as Sc } from 'effect'

export const CurrentUserProjectsWithRolesResponseZitadel = Sc.Struct({
  details: Sc.Struct({ totalResult: Sc.optional(Sc.NumberFromString) }),
  result: Sc.optional(Sc.Array(Sc.Struct({
    projectName: Sc.String,
    projectId: Sc.String,
    roles: Sc.optional(Sc.Array(Sc.String)),
    roleKeys: Sc.Array(Sc.String),
    userId: Sc.String,
    orgId: Sc.String,
    orgName: Sc.String,
    orgDomain: Sc.String,
    userType: Sc.String
  })))
})

export type CurrentUserProjectsWithRolesResponseZitadel = Sc.Schema.Type<
  typeof CurrentUserProjectsWithRolesResponseZitadel
>
