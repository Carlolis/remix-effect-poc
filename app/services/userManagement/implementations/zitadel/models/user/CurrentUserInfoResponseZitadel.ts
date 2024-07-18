import * as Sc from '@effect/schema/Schema'

import { UserIdSchema } from '../../../../models/user/UserId'

/**
 * @param result.user.human.profile.displayName a user can set his display name, if nothing is set ZITADEL computes "first_name last_name"
 * @param result.user.human.profile.preferredLanguage language tag analog https://tools.ietf.org/html/rfc3066
 * @param result.user.human.profile.gender Possible values: [GENDER_UNSPECIFIED, GENDER_FEMALE, GENDER_MALE, GENDER_DIVERSE]
                                            Default value: GENDER_UNSPECIFIED
                                            the gender of the human
 * @param result.user.human.profile.avatarUrl avatar URL of the user
 *
 * @param result.user.human.email.email email address of the user. (spec: https://tools.ietf.org/html/rfc2822#section-3.4.1)
 * @param result.user.human.email.isEmailVerified Is true if the user verified his email or if the email is managed outside ZITADEL
 *
 * @param result.user.human.phone.phone mobile phone number of the user. (use global pattern of spec https://tools.ietf.org/html/rfc3966)
 * @param result.user.human.phone.isPhoneVerified Is true if the user verified his phone or if the phone is managed outside ZITADEL
 *
 * @param result.user.machine.accessTokenType Possible values: [ACCESS_TOKEN_TYPE_BEARER, ACCESS_TOKEN_TYPE_JWT] Default value: ACCESS_TOKEN_TYPE_BEARER Type of access token to receive
 */
export const CurrentUserInfoResponseZitadel = Sc.Struct({
  user: Sc.Struct({
    id: UserIdSchema,
    state: Sc.String,
    userName: Sc.String,
    loginNames: Sc.Array(Sc.String),
    preferredLoginName: Sc.String,
    human: Sc.optional(Sc.Struct({
      profile: Sc.Struct({
        firstName: Sc.String,
        lastName: Sc.String,
        nickName: Sc.String,
        displayName: Sc.String,
        preferredLanguage: Sc.String,
        gender: Sc.String,
        avatarUrl: Sc.String
      }),
      email: Sc.Struct({
        email: Sc.String,
        isEmailVerified: Sc.Boolean
      }),
      phone: Sc.Struct({
        phone: Sc.String,
        isPhoneVerified: Sc.Boolean
      })
    })),
    machine: Sc.optional(Sc.Struct({
      name: Sc.String,
      description: Sc.optional(Sc.String),
      hasSecret: Sc.optional(Sc.Boolean),
      accessTokenType: Sc.optional(Sc.String)
    }))
  }),
  lastLogin: Sc.optional(Sc.DateFromString)
})

export type CurrentUserInfoResponseZitadel = Sc.Schema.Type<typeof CurrentUserInfoResponseZitadel>
