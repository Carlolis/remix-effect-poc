import * as Sc from '@effect/schema/Schema'

// const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()])(?=.*[a-z])(?=.*[A-Z]).{8,}$/

export const CreateUser = Sc.Struct({
  userName: Sc.String,
  firstName: Sc.String.pipe(Sc.maxLength(200)),
  lastName: Sc.String.pipe(Sc.maxLength(200)),
  email: Sc.String,
  password: Sc.String
})

export type CreateUser = Sc.Schema.Type<typeof CreateUser>
