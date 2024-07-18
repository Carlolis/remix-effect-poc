// const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()])(?=.*[a-z])(?=.*[A-Z]).{8,}$/

// export const CreateUserZitadelDTO = Sc.Struct({
//   userName: Sc.String,
//   profile: Sc.Struct({
//     firstName: Sc.String.pipe(Sc.maxLength(200)),
//     lastName: Sc.String.pipe(Sc.maxLength(200)),
//     nickName: Sc.optional(Sc.String.pipe(Sc.maxLength(200))),
//     displayName: Sc.optional(Sc.String.pipe(Sc.maxLength(200))),
//     preferredLanguage: Sc.optional(Sc.String.pipe(Sc.maxLength(10))),
//     gender: Sc.optional(
//       Sc.Literal('GENDER_UNSPECIFIED', 'GENDER_FEMALE', 'GENDER_MALE', 'GENDER_DIVERSE')
//     )
//   }),
//   email: Sc.Struct({
//     email: Sc.String,
//     isEmailVerified: Sc.optional(Sc.Boolean)
//   }),
//   phone: Sc.optional(Sc.Struct({
//     phone: Sc.optional(Sc.String.pipe(Sc.maxLength(50), Sc.minLength(1))),
//     isPhoneVerified: Sc.optional(Sc.Boolean)
//   })),
//   password: Sc.optional(Sc.String.pipe(Sc.pattern(passwordRegex))),
//   hashedPassword: Sc.optional(Sc.Struct({ value: Sc.String })),
//   passwordChangeRequired: Sc.optional(Sc.Boolean),
//   requestPasswordlessRegistration: Sc.optional(Sc.Boolean),
//   optCode: Sc.optional(Sc.String),
//   idps: Sc.optional(Sc.Array(Sc.Struct({
//     configId: Sc.String.pipe(Sc.maxLength(200)),
//     externalUserId: Sc.String.pipe(Sc.maxLength(200)),
//     displayName: Sc.String.pipe(Sc.maxLength(200))
//   })))
// })

export interface CreateUserZitadelDTO {
  userName: string
  profile: {
    firstName: string
    lastName: string
    nickName?: string
    displayName?: string
    preferredLanguage?: string
    gender: 'GENDER_UNSPECIFIED' | 'GENDER_FEMALE' | 'GENDER_MALE' | 'GENDER_DIVERSE'
  }
  email: {
    email: string
    isEmailVerified?: boolean
  }
  phone?: {
    phone?: string
    isPhoneVerified?: boolean
  }
  password?: string
  hashedPassword?: {
    value: string
  }
  passwordChangeRequired?: boolean
  requestPasswordlessRegistration?: boolean
  optCode?: string
  idps?: {
    configId: string
    externalUserId: string
    displayName: string
  }[]
}
