import * as Sc from '@effect/schema/Schema'

export const CreateUserMachine = Sc.Struct({
  name: Sc.String,
  userName: Sc.String
})

export type CreateUserMachine = Sc.Schema.Type<typeof CreateUserMachine>
