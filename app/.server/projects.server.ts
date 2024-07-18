import { HttpServer } from '@effect/platform'
import * as Sc from '@effect/schema/Schema'
import { redirect } from '@remix-run/node'
import { Effect as T } from 'effect'

import { JwtUserInfo } from '../routes/callback'
import { unwrapLoader } from '../runtime/Remix'
import { UserManagement } from '../services/userManagement/UserManagement'
import { getSession } from '../session'

export const loader = unwrapLoader(
  T.gen(function* (_) {
    const userManagement = yield* _(UserManagement)

    return T.gen(function* (_) {
      const headers = yield* _(
        HttpServer.request.schemaHeaders(Sc.Struct({ cookie: Sc.String })).pipe(
          T.catchAll(() => T.succeed({ cookie: 'hello' }))
        )
      )

      const session = yield* _(T.promise(() =>
        getSession(
          headers.cookie
        )
      ))

      const userInfo = yield* _(
        session.get('user_info'),
        Sc.decodeUnknown(JwtUserInfo)
      )
      const projects = yield* _(
        userManagement.getUserProjectsWithRoles(userInfo.sub)
      )

      return projects
    }).pipe(
      T.catchAll(e =>
        T.succeed(redirect('/notauthorize', {
          status: 301,
          statusText: e.toString()
        }))
      )
    )
  })
)
