import { HttpServer } from '@effect/platform'
import { Effect as T } from 'effect'
import { TicketCreationForm } from '~/routes/createTicket'
import { ServerResponse } from '~/runtime/ServerResponse'
import { CookieSessionStorage } from '~/runtime/services/CookieSessionStorage'
import { Remix } from '../runtime/Remix'
import { TicketService } from '../services/ticketService/TicketService'

export const loader = Remix.unwrapLoader(
  T.succeed(
    T.gen(function* () {
      return yield* CookieSessionStorage.getUserInfo()
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

    const createTicket = yield* HttpServer.request.schemaBodyForm(
      TicketCreationForm
    )

    const userInfo = yield* CookieSessionStorage.getUserInfo()

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
