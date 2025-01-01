import { Schema as Sc } from 'effect'
import * as B from 'effect/Brand'

export type CustomerId = string & B.Brand<'CustomerId'>
export const CustomerId = B.nominal<CustomerId>()
export const CustomerIdSchema = Sc.fromBrand(CustomerId)(Sc.String)
