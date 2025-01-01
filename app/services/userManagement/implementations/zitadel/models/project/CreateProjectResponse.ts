import { Schema as Sc } from 'effect'

export const CreateProjectResponse = Sc.Struct({
  id: Sc.String
})

export type CreateProjectResponse = Sc.Schema.Type<typeof CreateProjectResponse>
