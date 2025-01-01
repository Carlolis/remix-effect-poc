import { Schema as Sc } from 'effect'

export const ZitadelCreateApplication = Sc.Struct({
  name: Sc.String,
  authMethodTYpe: Sc.Array(
    Sc.Literal('API_AUTH_METHOD_TYPE_PRIVATE_KEY_JWT', 'API_AUTH_METHOD_TYPE_BASIC')
  )
})

export type ZitadelCreateApplication = Sc.Schema.Type<typeof ZitadelCreateApplication>
