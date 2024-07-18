import { HttpServer } from '@effect/platform'
import * as Sc from '@effect/schema/Schema'
import { Effect as T } from 'effect'

import { JwtUserInfo } from '../routes/callback'
import { Remix } from '../runtime/Remix'
import { TicketService } from '../services/ticketService/TicketService'
import { getSession } from '../session'
import { redirect } from '@remix-run/node'

export const loader = Remix.unwrapLoader(
  T.gen(function* (_) {
    const ticketService = yield* _(TicketService)

    return T.gen(function* (_) {
      const headers = yield* _(
        HttpServer.request.schemaHeaders(Sc.Struct({ cookie: Sc.String }))
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
      yield* _(T.logInfo('Ticket for user :', userInfo.email))
      const tickets = yield* _(ticketService.getAllTickets(userInfo.email))
      yield* _(T.logInfo('Ticket :', tickets))
      return tickets

    }).pipe(
      T.tapError(e => T.logError(`Tickets error : ${e}`)),
      T.catchAll(e =>

        T.succeed(redirect('/notauthorize', {
          status: 301,
          statusText: e.toString()
        }))
      )
    )
  })

)
