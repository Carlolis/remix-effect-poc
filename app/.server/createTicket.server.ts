import { HttpServer } from '@effect/platform'
import * as Sc from '@effect/schema/Schema'
import { redirect } from '@remix-run/node'
import { Effect as T, pipe } from 'effect'
import { TicketCreationForm } from '~/routes/createTicket'
import { JwtUserInfo } from '../routes/callback'
import { Remix } from '../runtime/Remix'
import { TicketService } from '../services/ticketService/TicketService'
import { commitSession, getSession } from '../session'

export const loader = Remix.unwrapLoader(
  T.succeed(
    T.gen(function* (_) {
      const headers = yield* _(
        HttpServer.request.schemaHeaders(Sc.Struct({ cookie: Sc.String }))
      )

      const session = yield* _(T.promise(() =>
        getSession(
          headers.cookie
        )
      ))

      return pipe(
        // TODO: write a function to get session and write an error
        session.get('user_info'),
        Sc.decodeUnknownSync(JwtUserInfo)
      )
    }).pipe(T.catchAll(e =>
      T.succeed(redirect('/notauthorize', {
        status: 301,
        statusText: e.toString()
      }))
    ))
  )
)

export const action = Remix.action(
  T.gen(function* (_) {
    const ticketService = yield* _(TicketService)

    const headers = yield* _(
      HttpServer.request.schemaHeaders(Sc.Struct({ cookie: Sc.String }))
    )

    const createTicket = yield* _(
      HttpServer.request.schemaBodyForm(TicketCreationForm)
    )

    const session = yield* _(T.promise(() =>
      getSession(
        headers.cookie
      )
    ))

    const userInfo = yield* _(pipe(session.get('user_info'), Sc.decodeUnknown(JwtUserInfo)))

    const userMail = userInfo.email

    yield* _(ticketService.createTicket(createTicket, userMail))
    session.set('ticket', createTicket.title)
    const cookie = yield* _(T.promise(() => commitSession(session)))
    return redirect('/tickets', {
      status: 301,
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Set-Cookie': cookie
      }
    })
  }).pipe(T.catchAll(e =>
    T.succeed(redirect('/notauthorize', {
      status: 301,
      statusText: e.toString()
    }))
  ))
)
