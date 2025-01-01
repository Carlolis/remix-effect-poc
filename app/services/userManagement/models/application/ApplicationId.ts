import { Schema as Sc } from 'effect'
import * as B from 'effect/Brand'

export type ApplicationId = string & B.Brand<'ApplicationId'>
export const ApplicationId = B.nominal<ApplicationId>()
export const ApplicationIdSchema = Sc.fromBrand(ApplicationId)(Sc.String)
