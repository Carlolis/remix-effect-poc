import { Schema as Sc } from 'effect'

export const CreateUserMachine = Sc.Struct({
  name: Sc.String,
  userName: Sc.String
})

export type CreateUserMachine = Sc.Schema.Type<typeof CreateUserMachine>
