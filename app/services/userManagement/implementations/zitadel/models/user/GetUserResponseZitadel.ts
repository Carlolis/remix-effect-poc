import { Schema as Sc } from 'effect'

import { UserIdSchema } from '../../../../models/user/UserId'

export const GetUserResponseZitadel = Sc.Struct({
  user: Sc.Struct({
    id: UserIdSchema
  })
})

export type GetUserResponseZitadel = Sc.Schema.Type<typeof GetUserResponseZitadel>
