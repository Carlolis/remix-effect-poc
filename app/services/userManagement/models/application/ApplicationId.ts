import * as Sc from '@effect/schema/Schema'
import * as B from 'effect/Brand'

export type ApplicationId = string & B.Brand<'ApplicationId'>
export const ApplicationId = B.nominal<ApplicationId>()
export const ApplicationIdSchema = Sc.fromBrand(ApplicationId)(Sc.String)
