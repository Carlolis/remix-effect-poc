import { Schema as Sc } from 'effect'
import * as B from 'effect/Brand'

export type UserId = string & B.Brand<'UserId'>
export const UserId = B.nominal<UserId>()
export const UserIdSchema = Sc.fromBrand(UserId)(Sc.String)
