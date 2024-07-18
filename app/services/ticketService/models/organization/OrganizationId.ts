import * as Sc from '@effect/schema/Schema'
import * as B from 'effect/Brand'

export type OrganizationId = string & B.Brand<'OrganizationId'>
export const OrganizationId = B.nominal<OrganizationId>()
export const OrganizationIdSchema = Sc.fromBrand(OrganizationId)(Sc.String)
