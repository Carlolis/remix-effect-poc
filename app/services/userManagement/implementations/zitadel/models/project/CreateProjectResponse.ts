import * as Sc from '@effect/schema/Schema'

export const CreateProjectResponse = Sc.Struct({
  id: Sc.String
})

export type CreateProjectResponse = Sc.Schema.Type<typeof CreateProjectResponse>
