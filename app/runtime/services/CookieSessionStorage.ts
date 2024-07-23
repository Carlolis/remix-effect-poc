import { HttpServer } from '@effect/platform'
import * as Sc from '@effect/schema/Schema'
import { formatErrorSync } from '@effect/schema/TreeFormatter'
import { Session, SessionData } from '@remix-run/node'
import { Effect as T } from 'effect'
import type { Tag } from 'effect/Context'
import { JwtUserInfo } from '~/routes/callback'
import { getSession } from '~/session'
import { NotAuthenticated } from '../models/NotAuthenticatedError'



export class CookieSessionStorage extends T.Tag('CookieSessionStorage')<CookieSessionStorage, {

  getUserInfo(): T.Effect<JwtUserInfo, NotAuthenticated>
  commitSession(session: Session<SessionData, SessionData>): T.Effect<HeadersInit, never>
}>() {

  static make = () => {

    return T.gen(function* (_) {

      const cookies = yield* _(
        HttpServer.request.schemaHeaders(Sc.Struct({ cookie: Sc.String })),
        T.mapError(e => NotAuthenticated.of(formatErrorSync(e))),
        T.map(headers => headers.cookie),
      )
      return CookieSessionStorage.of({
        commitSession: () => T.succeed({ 'Set-Cookie': "session.commit()" }),
        getUserInfo: () =>
          T.gen(function* (_) {
            const session = yield* _(T.promise(() =>
              getSession(
                cookies
              )
            ))

            const userInfo = yield* _(
              session.get('user_info'),
              Sc.decodeUnknown(JwtUserInfo),
              T.mapError(e => NotAuthenticated.of(formatErrorSync(e))),
            )

            return userInfo
          })
      })
    })
  }
}

export type CookieSessionStorageService = Tag.Service<typeof CookieSessionStorage>
