import { HttpServer } from '@effect/platform'
import * as Sc from '@effect/schema/Schema'
import { formatErrorSync } from '@effect/schema/TreeFormatter'
import { Session, SessionData } from '@remix-run/node'
import { Effect as T, pipe } from 'effect'
import type { Tag } from 'effect/Context'
import * as L from 'effect/Layer'
import * as O from 'effect/Option'
import { JwtUserInfo } from '~/routes/callback'
import { commitSession, getSession } from '~/session'
import { NotAuthenticated } from '../models/NotAuthenticatedError'
import { Redirect, ServerResponse } from '../ServerResponse'

export class CookieSessionStorage extends T.Tag('CookieSessionStorage')<CookieSessionStorage, {
  getUserInfo(): T.Effect<JwtUserInfo, Redirect>
  commitSession(session: Session<SessionData, SessionData>): T.Effect<HeadersInit, never>
  commitCodeVerifierAndNonceToSession(
    { codeVerifier, nonce, authorizationUrl }: {
      codeVerifier: string
      nonce: string
      authorizationUrl: string
    }
  ): T.Effect<Redirect, Redirect>
}>() {
  static make = () => {
    return T.gen(function* (_) {
      const optionalCookies: O.Option<string> = yield* _(
        HttpServer.request.schemaHeaders(Sc.Struct({ cookie: Sc.String })),
        T.mapError(e => NotAuthenticated.of(formatErrorSync(e))),
        T.map(headers => O.some(headers.cookie)),
        T.tapError(e => T.logError(`CookieSessionStorage - get cookies for service`, e.message)),
        T.catchAll(() => T.succeed(O.none()) // ServerResponse.Redirect({
          //   location: '/notauthorize',
          // })
        )
      )

      return CookieSessionStorage.of({
        commitSession: () => T.succeed({ 'Set-Cookie': 'session.commit()' }),
        commitCodeVerifierAndNonceToSession: ({ codeVerifier, nonce, authorizationUrl }) =>
          T.gen(function* (_) {
            const session = yield* _(T.promise(() =>
              pipe(
                optionalCookies,
                O.getOrUndefined,
                cookies =>
                  getSession(
                    cookies
                  )
              )
            ))

            session.set('code_verifier', codeVerifier)
            session.set('nonce', nonce)

            const cookie = yield* _(T.promise(() => commitSession(session)))

            return yield* _(ServerResponse.Redirect({
              location: authorizationUrl,
              headers: {
                'Set-Cookie': cookie
              }
            }))
          }),
        getUserInfo: () =>
          T.gen(function* (_) {
            const cookies = yield* _(
              optionalCookies,
              T.catchAll(() => {
                return ServerResponse.Redirect({
                  location: '/notauthorize'
                })
              })
            )

            const session = yield* _(T.promise(() =>
              getSession(
                cookies
              )
            ))

            const userInfo = yield* _(
              session.get('user_info'),
              Sc.decodeUnknown(JwtUserInfo),
              T.mapError(e => NotAuthenticated.of(formatErrorSync(e))),
              T.tapError(e => T.logError(`CookieSessionStorage - getUserInfo`, e)),
              T.catchAll(() =>
                ServerResponse.Redirect({
                  location: '/notauthorize'
                })
              )
            )

            return userInfo
          })
      })
    })
  }
  static layer = L.effect(CookieSessionStorage)(this.make())
}

export type CookieSessionStorageService = Tag.Service<typeof CookieSessionStorage>
