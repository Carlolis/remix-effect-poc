import * as Sc from '@effect/schema/Schema'

export const CreateApplicationResponse = Sc.Struct({
  appId: Sc.String
})

export type CreateApplicationResponse = Sc.Schema.Type<typeof CreateApplicationResponse>
