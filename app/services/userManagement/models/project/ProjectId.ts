import * as Sc from '@effect/schema/Schema'
import * as B from 'effect/Brand'

export type ProjectId = string & B.Brand<'ProjectId'>
export const ProjectId = B.nominal<ProjectId>()
export const ProjectIdSchema = Sc.fromBrand(ProjectId)(Sc.String)
