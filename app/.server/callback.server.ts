import { HttpServer } from '@effect/platform'

import * as Sc from '@effect/schema/Schema'
import { Effect as T, pipe, unsafeCoerce } from 'effect'
import * as O from 'effect/Option'
import jwt from 'jsonwebtoken'

import { CookieSessionStorage } from '~/runtime/services/CookieSessionStorage'
import { JwtUserInfo } from '../routes/callback'
import { Remix } from '../runtime/Remix'
import {
  oidcConfig,
  OpenIdClient
} from '../services/userManagement/implementations/zitadel/OidcClient'

export const loader = Remix.loader(
  T.gen(function* () {
    const { codeVerifier, nonce } = yield* CookieSessionStorage.getCodeVerifierAndNonce()

    const url = yield* HttpServer.request.ServerRequest

    // FIXME: this is a hack to get the request object
    const params = yield* OpenIdClient.callbackParams(unsafeCoerce(url))

    // Note: In a real-world scenario, validate the nonce against what was stored in the session or cookie
    const tokenSet = yield* pipe(
      // eslint-disable-next-line @typescript-eslint/naming-convention
      OpenIdClient.callback(oidcConfig.redirect_uri, params, {
        code_verifier: codeVerifier,
        nonce
      }),
      T.flatMap(data => T.tryPromise(() => data)),
      T.tapError(e => T.logError(e))
    )

    yield* T.logInfo('tokenSet', nonce)

    const jwtDecodeUserInfo = yield* O.fromNullable(tokenSet.id_token).pipe(
      O.map(jwt.decode),
      T.flatMap(Sc.decodeUnknown(JwtUserInfo)),
      T.tapError(e => T.logError(e))
    )

    return yield* CookieSessionStorage.commitUserInfo(jwtDecodeUserInfo)
  }).pipe(T.catchAll(() => T.die({ cookie: 'callback die' })))
)
