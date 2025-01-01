import { Schema as Sc } from 'effect'

export const AddGrantMemberResponseZitadel = Sc.Struct({
  userGrantId: Sc.String
})

export type AddGrantMemberResponseZitadel = Sc.Schema.Type<typeof AddGrantMemberResponseZitadel>
