import { HttpServer } from '@effect/platform'

import * as Sc from '@effect/schema/Schema'
import { json } from '@remix-run/node'
import { Effect as T, unsafeCoerce } from 'effect'
import * as O from 'effect/Option'
import jwt from 'jsonwebtoken'

import { JwtUserInfo } from '../routes/callback'
import { Remix } from '../runtime/Remix'
import {
  oidcConfig,
  OpenIdClient
} from '../services/userManagement/implementations/zitadel/OidcClient'
import { commitSession, getSession } from '../session'

export const loader = Remix.loader(
  T.gen(function* (_) {
    const client = yield* _(OpenIdClient)




    const session = yield* _(
      HttpServer.request.schemaHeaders(Sc.Struct({ cookie: Sc.optional(Sc.String) })),
      T.flatMap(({ cookie }) =>
        T.tryPromise(() =>
          getSession(
            cookie
          )
        )
      ),

      T.catchAll(() => T.tryPromise(() => getSession()))
    )


    const codeVerifier = yield* _(Sc.decodeUnknown(Sc.String)(session.get('code_verifier')))

    const nonce = yield* _(Sc.decodeUnknown(Sc.String)(session.get('nonce')))

    const url = yield* _(HttpServer.request.ServerRequest).pipe(T.map(eee => eee))

    //FIXME: this is a hack to get the request object
    const params = client.callbackParams(unsafeCoerce(url))

    // Note: In a real-world scenario, validate the nonce against what was stored in the session or cookie
    const tokenSet = yield* _(
      T.tryPromise(() =>
        // eslint-disable-next-line @typescript-eslint/naming-convention
        client.callback(oidcConfig.redirect_uri, params, { code_verifier: codeVerifier, nonce })
      ),
      T.tapError(e => T.logError(e))
    )
    yield* _(T.logInfo('tokenSet', nonce))
    const jwtDecodeUserInfo = yield* _(
      O.fromNullable(tokenSet.id_token),
      O.map(jwt.decode),
      T.flatMap(Sc.decodeUnknown(JwtUserInfo)),
      T.tapError(e => T.logError(e))
    )

    session.set('user_info', jwtDecodeUserInfo)
    session.set('access_token', tokenSet.access_token)
    const cookie = yield* _(T.promise(() => commitSession(session)))
    return json(jwtDecodeUserInfo, {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Set-Cookie': cookie
      }
    })
  }).pipe(T.catchAll(() => T.die({ cookie: 'callback die' })))
)