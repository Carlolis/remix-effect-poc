import { HttpServerRequest } from '@effect/platform'

// import { json, TypedResponse } from 'react-router';
import { Effect as T, pipe, Schema as Sc } from 'effect'
import type { Tag } from 'effect/Context'
import * as L from 'effect/Layer'
import * as O from 'effect/Option'
import { JwtUserInfo } from '~/routes/callback'
import { commitSession, getSession } from '~/session'
import { NotAuthenticated } from '../models/NotAuthenticatedError'
import { Redirect, ServerResponse } from '../ServerResponse'

export class CookieSessionStorage extends T.Tag('CookieSessionStorage')<CookieSessionStorage, {
  commitUserInfo(userInfo: JwtUserInfo): T.Effect<Response, Redirect>
  getUserName(): T.Effect<string | null>
  getUserInfo(): T.Effect<JwtUserInfo, Redirect>
  commitUserName(userName: string): T.Effect<never, Redirect>
  commitCodeVerifierAndNonce(
    { codeVerifier, nonce, authorizationUrl }: {
      codeVerifier: string
      nonce: string
      authorizationUrl: string
    }
  ): T.Effect<never, Redirect>
  getCodeVerifierAndNonce(): T.Effect<{ codeVerifier: string; nonce: string }, Redirect>
}>() {
  static make = () => {
    return T.gen(function* (_) {
      const optionalCookies: O.Option<string> = yield* _(
        HttpServerRequest.schemaHeaders(Sc.Struct({ cookie: Sc.String })),
        T.mapError(e => NotAuthenticated.of(e.message)),
        T.map(headers => O.some(headers.cookie)),
        T.tapError(e => T.logError(`CookieSessionStorage - get cookies for service`, e.message)),
        T.catchAll(() => T.succeed(O.none()))
      )

      return CookieSessionStorage.of({
        commitUserInfo: userInfo =>
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
            yield* T.logInfo(`CookieSessionStorage - commitUserInfo`, userInfo, session)

            session.set('user_info', userInfo)

            const cookie = yield* _(T.promise(() => commitSession(session)))

            return Response.json({
              body: userInfo,
              headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Set-Cookie': cookie
              }
            })
          }),
        commitUserName: userName =>
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
            yield* T.logInfo(`CookieSessionStorage - commitUserName`, userName, session)

            session.set('userName', userName)

            const cookie = yield* _(T.promise(() => commitSession(session)))

            return yield* _(ServerResponse.Redirect({
              location: '/login',
              headers: {
                'Set-Cookie': cookie
              }
            }))
          }),
        commitCodeVerifierAndNonce: ({ codeVerifier, nonce, authorizationUrl }) =>
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
            console.log('commitCodeVerifierAndNonce', session)
            const cookie = yield* _(T.promise(() => commitSession(session)))

            return yield* _(ServerResponse.Redirect({
              location: authorizationUrl,
              headers: {
                'Set-Cookie': cookie
              }
            }))
          }),
        getCodeVerifierAndNonce: () =>
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

            const codeVerifier = yield* Sc.decodeUnknown(Sc.String)(
              session.get('code_verifier')
            )

            const nonce = yield* Sc.decodeUnknown(Sc.String)(session.get('nonce'))

            return { codeVerifier, nonce }
          }).pipe(T.catchAll(() =>
            ServerResponse.Redirect({
              location: '/notauthorize'
            })
          )),
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
              T.mapError(e => NotAuthenticated.of(e.message)),
              T.tapError(e => T.logError(`CookieSessionStorage - getUserInfo`, e)),
              T.catchAll(() =>
                ServerResponse.Redirect({
                  location: '/notauthorize'
                })
              )
            )

            return userInfo
          }),
        getUserName: () =>
          T.gen(function* (_) {
            const cookies = yield* _(
              optionalCookies,
              T.catchAll(() => {
                return T.succeed(undefined)
              })
            )

            const session = yield* _(T.promise(() =>
              getSession(
                cookies
              )
            ))

            return yield* _(
              session.get('userName'),
              Sc.decodeUnknown(Sc.String),
              T.catchAll(() => T.succeed(null))
            )
          })
      })
    })
  }
  // @ts-expect-error wtf
  static layer: L.Layer<CookieSessionStorage, never, never> = L.effect(CookieSessionStorage)(
    this.make()
  )
}

export type CookieSessionStorageService = Tag.Service<typeof CookieSessionStorage>
