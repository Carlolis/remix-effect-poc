import { Schema as Sc } from 'effect'

export const CreateApplicationResponse = Sc.Struct({
  appId: Sc.String
})

export type CreateApplicationResponse = Sc.Schema.Type<typeof CreateApplicationResponse>
