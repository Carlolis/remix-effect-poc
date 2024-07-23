import { HttpServer } from "@effect/platform";
import * as Sc from "@effect/schema/Schema";
import { pipe, Effect as T } from "effect";

import { JwtUserInfo } from "../routes/callback";
import { Remix } from "../runtime/Remix";
import { TicketService } from "../services/ticketService/TicketService";
import { getSession } from "../session";
import { redirect } from "@remix-run/node";

export const loader = Remix.unwrapLoader(
  T.gen(function* () {
    const ticketService = yield* TicketService;

    return T.gen(function* () {
      const headers = yield* HttpServer.request.schemaHeaders(
        Sc.Struct({ cookie: Sc.String })
      );
      const session = yield* T.promise(() => getSession(headers.cookie));

      const userInfo = yield* pipe(
        session.get("user_info"),
        Sc.decodeUnknown(JwtUserInfo)
      );
      yield* T.logInfo("Ticket for user :", userInfo.email);
      const tickets = yield* ticketService.getAllTickets(userInfo.email);
      yield* T.logInfo("Ticket :", tickets);
      return tickets;
    }).pipe(
      T.tapError((e) => T.logError(`Tickets error : ${e}`)),
      T.catchAll((e) =>
        T.succeed(
          redirect("/notauthorize", {
            status: 301,
            statusText: e.toString(),
          })
        )
      )
    );
  })
);
