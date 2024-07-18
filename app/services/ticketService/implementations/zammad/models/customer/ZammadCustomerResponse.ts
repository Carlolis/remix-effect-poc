/* eslint-disable @typescript-eslint/naming-convention */
import * as Sc from '@effect/schema/Schema'
import { SchemaPrimitives } from '@rebaze-fr/util-effect-utils-next'
import { pipe } from 'effect'

export const ZammadCustomerIdBrand = Symbol('ZammadCustomerId')

export const ZammadCustomerId = pipe(
  SchemaPrimitives.StringFromStringOrNumber,
  Sc.brand(ZammadCustomerIdBrand)
)

/**
 * @param id CustomerId
 * @param login Customer's userName
 */
export const ZammadCustomerResponse = Sc.Struct({
  id: ZammadCustomerId,
  organization_id: Sc.NullOr(Sc.Number),
  login: Sc.String,
  firstname: Sc.String,
  lastname: Sc.String,
  email: Sc.String
})

export type ZammadCustomerResponse = Sc.Schema.Type<typeof ZammadCustomerResponse>
