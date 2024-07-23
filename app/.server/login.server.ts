import { HttpServer } from "@effect/platform";
import * as Sc from "@effect/schema/Schema";

import { Effect as T, pipe } from "effect";
import * as O from "effect/Option";
import { ServerResponse } from "~/runtime/ServerResponse";
import { Remix } from "../runtime/Remix";
import { UserManagement } from "../services/userManagement/UserManagement";
import { commitSession, getSession } from "../session";

// loader
export const loader = Remix.loader(
  T.gen(function* () {
    const session = yield* HttpServer.request
      .schemaHeaders(Sc.Struct({ cookie: Sc.optional(Sc.String) }))
      .pipe(
        T.flatMap(({ cookie }) => T.tryPromise(() => getSession(cookie))),

        T.catchAll(() => T.tryPromise(() => getSession()))
      );

    const userName: string | undefined = pipe(
      session.get("username"),
      Sc.decodeUnknownOption(Sc.String),
      O.getOrUndefined
    );
    return userName ?? "error";
  }).pipe(T.catchAll(() => T.succeed("error")))
);

export const action = Remix.action(
  T.gen(function* () {
    T.log("action login");
    const userManagement = yield* UserManagement;

    const { codeVerifier, nonce, authorizationUrl } =
      yield* userManagement.login;

    const session = yield* HttpServer.request
      .schemaHeaders(Sc.Struct({ cookie: Sc.String }))
      .pipe(
        T.flatMap(({ cookie }) => T.tryPromise(() => getSession(cookie))),
        T.catchAll(() => T.promise(() => getSession()))
      );

    session.set("code_verifier", codeVerifier);
    session.set("nonce", nonce);
    const cookie = yield* T.promise(() => commitSession(session));

    return yield* ServerResponse.Redirect({
      location: authorizationUrl,
      headers: {
        "Set-Cookie": cookie,
      },
    });
  })
);
