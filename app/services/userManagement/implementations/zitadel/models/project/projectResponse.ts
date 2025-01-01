import { Schema as Sc } from 'effect'

import { ProjectIdSchema } from '../../../../models/project/ProjectId'

export const ProjectResponse = Sc.Struct({
  result: Sc.optional(Sc.Array(Sc.Struct({
    id: ProjectIdSchema,
    name: Sc.String
  })))
})

export type ProjectResponse = Sc.Schema.Type<typeof ProjectResponse>
