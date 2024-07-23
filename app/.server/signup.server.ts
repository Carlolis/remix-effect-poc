// First we create our UI with the form doing a POST and the inputs with the

import { HttpServer } from "@effect/platform";
import * as Sc from "@effect/schema/Schema";
import { json, redirect } from "@remix-run/node";
import { Effect as T, pipe } from "effect";

import { CreateUserForm } from "~/routes/signup";
import { unwrapAction, unwrapLoader } from "../runtime/Remix";
import { TicketService } from "../services/ticketService/TicketService";
import { CreateUser } from "../services/userManagement/models/user/CreateUser";
import { UserManagement } from "../services/userManagement/UserManagement";
import { commitSession, getSession } from "../session";

export const action = unwrapAction(
  T.gen(function* () {
    const userManagement = yield* UserManagement;

    const ticketService = yield* TicketService;

    return T.gen(function* () {
      const createUserForm = yield* HttpServer.request.schemaBodyForm(
        CreateUserForm
      );

      const roles = createUserForm.roles;
      const projectId = createUserForm.projectId;
      const createUser = Sc.decodeSync(CreateUser)(createUserForm);
      const userCreated = yield* userManagement.createUser(createUser);
      yield* ticketService.createCustomer({
        email: createUser.email,
        userName: createUser.userName,
        lastName: createUser.lastName,
        firstName: createUser.firstName,
        roles,
      });

      yield* userManagement.addUserRolesToProject(
        userCreated.userId,
        projectId,
        roles
      );
      const headers = yield* HttpServer.request.schemaHeaders(
        Sc.Struct({ cookie: Sc.String })
      );
      const session = yield* T.promise(() => getSession(headers.cookie));
      session.set("username", createUser.userName);
      const cookie = yield* T.promise(() => commitSession(session));
      return redirect("/login", {
        status: 301,
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "Set-Cookie": cookie,
        },
      });
    }).pipe(
      T.tapError((e) => T.logError("CreateUserForm", e)),
      T.catchAll(() => T.succeed("CreateUserForm error"))
    );
  })
);

export const loader = unwrapLoader(
  pipe(
    UserManagement,
    T.map((userManagement) => userManagement.getAllProjects.pipe(T.map(json)))
  )
);
