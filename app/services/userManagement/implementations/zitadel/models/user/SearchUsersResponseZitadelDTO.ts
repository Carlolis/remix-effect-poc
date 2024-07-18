import * as Sc from '@effect/schema/Schema'

export const SearchUsersResponseZitadelDTO = Sc.Struct({
  result: Sc.Array(
    Sc.Struct({
      id: Sc.String,
      userName: Sc.String
    })
  )
})

export type SearchUsersResponseZitadel = Sc.Schema.Type<typeof SearchUsersResponseZitadelDTO>
