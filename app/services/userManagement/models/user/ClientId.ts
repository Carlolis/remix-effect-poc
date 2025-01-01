import { Schema as Sc } from 'effect'
import { pipe } from 'effect'

export const ClientIdBrand = Symbol('ClientId')

export const ClientId = pipe(Sc.String, Sc.brand(ClientIdBrand))

export type ClientId = Sc.Schema.Type<typeof ClientId>
