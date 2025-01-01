import { Schema as Sc } from 'effect'
import * as B from 'effect/Brand'

export type AccessToken = string & B.Brand<'AccessToken'>
export const AccessToken = B.nominal<AccessToken>()
export const AccessTokenSchema = Sc.fromBrand(AccessToken)(Sc.String)
