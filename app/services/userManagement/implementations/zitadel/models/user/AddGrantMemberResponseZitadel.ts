import * as Sc from '@effect/schema/Schema'

export const AddGrantMemberResponseZitadel = Sc.Struct({
  userGrantId: Sc.String
})

export type AddGrantMemberResponseZitadel = Sc.Schema.Type<typeof AddGrantMemberResponseZitadel>
