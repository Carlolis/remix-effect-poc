import { Schema as Sc } from 'effect'
import { Email } from '~/runtime/models/Email'

// const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()])(?=.*[a-z])(?=.*[A-Z]).{8,}$/

export const CreateUser = Sc.Struct({
  userName: Sc.String,
  firstName: Sc.String.pipe(Sc.maxLength(200)),
  lastName: Sc.String.pipe(Sc.maxLength(200)),
  email: Email,
  password: Sc.String
})

export type CreateUser = Sc.Schema.Type<typeof CreateUser>
