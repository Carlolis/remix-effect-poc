import { Effect as T } from "effect";

import { CookieSessionStorage } from '~/runtime/services/CookieSessionStorage';
import { Remix } from "../runtime/Remix";
import { TicketService } from "../services/ticketService/TicketService";

export const loader = Remix.unwrapLoader(
  T.gen(function* () {
    const ticketService = yield* TicketService;


    return T.gen(function* () {
      const cookieSessionStorage = yield* (CookieSessionStorage)
      const userInfo = yield* 
        cookieSessionStorage.getUserInfo()
    
      yield* (T.logInfo('Ticket for user :', userInfo.email))
      const tickets = yield* (ticketService.getAllTickets(userInfo.email))
      yield* (T.logInfo('Ticket :', tickets))
      return tickets

    })
  })
);
