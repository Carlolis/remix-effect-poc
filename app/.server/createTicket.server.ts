import { HttpServer } from '@effect/platform'
import * as Sc from '@effect/schema/Schema'
import { Effect as T, pipe } from 'effect'
import { TicketCreationForm } from '~/routes/createTicket'
import { ServerResponse } from '~/runtime/ServerResponse'
import { JwtUserInfo } from '../routes/callback'
import { Remix } from '../runtime/Remix'
import { TicketService } from '../services/ticketService/TicketService'
import { getSession } from '../session'

export const loader = Remix.unwrapLoader(
  T.succeed(
    T.gen(function* () {
      const headers = yield* HttpServer.request.schemaHeaders(
        Sc.Struct({ cookie: Sc.String })
      )

      const session = yield* T.promise(() => getSession(headers.cookie))

      return pipe(
        // TODO: write a function to get session and write an error
        session.get('user_info'),
        Sc.decodeUnknownSync(JwtUserInfo)
      )
    }).pipe(
      T.catchAll(() =>
        ServerResponse.Redirect({
          location: '/notauthorize'
        })
      )
    )
  )
)

export const action = Remix.action(
  T.gen(function* () {
    const ticketService = yield* TicketService

    const headers = yield* HttpServer.request.schemaHeaders(
      Sc.Struct({ cookie: Sc.String })
    )

    const createTicket = yield* HttpServer.request.schemaBodyForm(
      TicketCreationForm
    )

    const session = yield* T.promise(() => getSession(headers.cookie))

    const userInfo = session
      .get('user_info')
      .pipe(Sc.decodeUnknown(JwtUserInfo))

    const userMail = userInfo.email

    yield* (ticketService.createTicket(createTicket, userMail))

    return yield* (ServerResponse.Redirect({
      location: '/tickets'
    }))
  }).pipe(T.catchAll(() =>
    ServerResponse.Redirect({
      location: '/notauthorize'
    })
  ))
)
