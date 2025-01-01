/* eslint-disable @typescript-eslint/naming-convention */
import { pipe, Schema as Sc } from 'effect'
import { StringFromStringOrNumber } from '~/services/StringFromStringOrNumber'

export const ZammadOrganizationIdBrand = Symbol('ZammadOrganizationId')

export const ZammadOrganizationId = pipe(
  StringFromStringOrNumber,
  Sc.brand(ZammadOrganizationIdBrand)
)

/**
 * @param id OrganizationId
 */
export const ZammadOrganizationResponse = Sc.Struct({
  id: ZammadOrganizationId,
  name: Sc.String,
  domain: Sc.String,
  domain_assignment: Sc.Boolean,
  active: Sc.Boolean,
  note: Sc.String,
  updated_by_id: Sc.Number,
  created_by_id: Sc.Number,
  created_at: Sc.String,
  updated_at: Sc.String,
  vip: Sc.Boolean,
  member_ids: Sc.Array(Sc.Number),
  secondary_member_ids: Sc.Array(Sc.Number)
})

export type ZammadOrganizationResponse = Sc.Schema.Type<typeof ZammadOrganizationResponse>
