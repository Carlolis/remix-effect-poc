import { Schema as Sc } from 'effect'

import { UserIdSchema } from '../../../../models/user/UserId'

export const CreateUserResponseZitadelDTO = Sc.Struct({
  userId: UserIdSchema,
  detail: Sc.optional(Sc.Struct({
    sequence: Sc.BigDecimalFromNumber,
    creationDate: Sc.Date,
    changeDate: Sc.Date,
    resourceOwner: Sc.Unknown
  })),
  passwordlessRegistration: Sc.optional(Sc.Struct({
    link: Sc.String,
    expiration: Sc.String
  }))
})

export type CreateUserResponseZitadel = Sc.Schema.Type<typeof CreateUserResponseZitadelDTO>
