/* eslint-disable @typescript-eslint/naming-convention */
import { pipe, Schema as Sc } from 'effect'
import { StringFromStringOrNumber } from '~/services/StringFromStringOrNumber'

export const ZammadCustomerIdBrand = Symbol('ZammadCustomerId')

export const ZammadCustomerId = pipe(
  StringFromStringOrNumber,
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
