import { HttpServer } from "@effect/platform";
import * as Sc from "@effect/schema/Schema";
import { redirect } from "@remix-run/node";
import { pipe, Effect as T } from "effect";

import { JwtUserInfo } from "../routes/callback";
import { UserManagement } from "../services/userManagement/UserManagement";
import { getSession } from "../session";
import { unwrapLoader } from "~/runtime/Remix";

export const loader = T.gen(function* () {
  const userManagement = yield* UserManagement;

  return T.gen(function* () {
    const headers = yield* HttpServer.request
      .schemaHeaders(Sc.Struct({ cookie: Sc.String }))
      .pipe(T.catchAll(() => T.succeed({ cookie: "hello" })));

    const session = yield* T.promise(() => getSession(headers.cookie));

    const userInfo = yield* pipe(
      session.get("user_info"),
      Sc.decodeUnknown(JwtUserInfo)
    ); 

    const projects = yield* userManagement.getUserProjectsWithRoles(
      userInfo.sub
    );

    return projects;
  }).pipe(
    T.catchAll((e) =>
      T.succeed(
        redirect("/notauthorize", {
          status: 301,
          statusText: e.toString(),
        })
      )
    )
  );
}).pipe(unwrapLoader);
