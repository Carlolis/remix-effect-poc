import { Schema as Sc } from 'effect'

export const SearchUsersResponseZitadelDTO = Sc.Struct({
  result: Sc.Array(
    Sc.Struct({
      id: Sc.String,
      userName: Sc.String
    })
  )
})

export type SearchUsersResponseZitadel = Sc.Schema.Type<typeof SearchUsersResponseZitadelDTO>
