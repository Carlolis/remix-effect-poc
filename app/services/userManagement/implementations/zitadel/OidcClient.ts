/* eslint-disable @typescript-eslint/naming-convention */
import { Config, Effect as T, Layer as L } from 'effect'
import type { BaseClient } from 'openid-client'
import { Issuer } from 'openid-client'

export const oidcConfig = {
  issuer: 'http://localhost:8084',
  client_secret: 'your-client-secret',
  redirect_uri: 'http://localhost:4200/callback'
}

export const OpenIdClient = T.Tag('OpenIdClient')<
  BaseClient,
  BaseClient
>()

const clientEffect = T.gen(function* () {
  const ZITADEL_CLIENT_ID = yield* Config.string('ZITADEL_CLIENT_ID').pipe(
    T.catchAll(T.die)
  )
  return yield* T.promise(() =>
    Issuer.discover(oidcConfig.issuer).then(
      issuer =>
        new issuer.Client({
          client_id: ZITADEL_CLIENT_ID,
          client_secret: oidcConfig.client_secret,
          redirect_uris: [oidcConfig.redirect_uri],
          response_types: ['code']
        })
    )
  )
})

// const clientEffectPipe = pipe(
//   Config.string('ZITADEL_ACCESS_TOKEN_CLIENT_ID'),
//   T.catchAll(T.die),
//   T.flatMap(clientId =>
//     T.promise(_ =>
//       Issuer.discover(oidcConfig.issuer).then(issuer =>
//         new issuer.Client({
//           client_id: clientId,
//           client_secret: oidcConfig.client_secret,
//           redirect_uris: [oidcConfig.redirect_uri],
//           response_types: ['code']
//         })
//       )
//     )
//   )
// )

export const OpenIdClientLayer = L.effect(OpenIdClient)(clientEffect)
