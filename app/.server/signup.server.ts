// First we create our UI with the form doing a POST and the inputs with the

import { HttpServer } from '@effect/platform'
import * as Sc from '@effect/schema/Schema'
import { Effect as T } from 'effect'

import { CreateUserForm } from '~/routes/signup'
import { ServerResponse } from '~/runtime/ServerResponse'
import { CookieSessionStorage } from '~/runtime/services/CookieSessionStorage'
import { unwrapAction, unwrapLoader } from '../runtime/Remix'
import { TicketService } from '../services/ticketService/TicketService'
import { CreateUser } from '../services/userManagement/models/user/CreateUser'
import { UserManagement } from '../services/userManagement/UserManagement'

export const action = unwrapAction(
  T.gen(function* () {
    const userManagement = yield* UserManagement

    const ticketService = yield* TicketService

    return T.gen(function* () {
      const createUserForm = yield* HttpServer.request.schemaBodyJson(
        CreateUserForm
      )

      const roles = createUserForm.roles
      const projectId = createUserForm.projectId
      const createUser = Sc.decodeSync(CreateUser)(createUserForm)
      const userCreated = yield* userManagement.createUser(createUser)
      yield* ticketService.createCustomer({
        email: createUser.email,
        userName: createUser.userName,
        lastName: createUser.lastName,
        firstName: createUser.firstName,
        roles
      })

      yield* userManagement.addUserRolesToProject(
        userCreated.userId,
        projectId,
        roles
      )

      return yield* CookieSessionStorage.commitUserName(createUser.userName)
    }).pipe(
      T.tapError(e => T.logError('CreateUserForm', e)),
      T.catchTag('UserAlreadyExist', () =>
        ServerResponse.Redirect({
          location: '/signup'
        })),
      T.catchTag('PasswordNotEnoughStrong', () =>
        ServerResponse.Redirect({
          location: '/signup'
        })),
      T.catchTag('RequestError', () =>
        ServerResponse.Redirect({
          location: '/signup'
        }))
    )
  })
)

export const loader = unwrapLoader(
  T.succeed(UserManagement.getAllProjects())
)
