import type { HttpClientError } from '@effect/platform/Http/ClientError'
import * as Http from '@effect/platform/HttpClient'
import * as Sc from '@effect/schema/Schema'
import { formatErrorSync } from '@effect/schema/TreeFormatter'
import { Cause, Config, Effect as T, Layer as L, pipe } from 'effect'
import * as A from 'effect/Array'
import { catchTags } from 'effect/Effect'
import type { BaseClient } from 'openid-client'
import { generators } from 'openid-client'

import { PasswordNotEnoughStrong } from '../../errors/PasswordNotEnoughStrong'
import { ServerError } from '../../errors/ServerError'
import { UserAlreadyExist } from '../../errors/UserAlreadyExist'
import { UserNotFoundError } from '../../errors/UserNotFoundError'
import { ApplicationIdSchema } from '../../models/application/ApplicationId'
import { ProjectIdSchema } from '../../models/project/ProjectId'
import { AccessTokenSchema } from '../../models/user/AccessToken'
import { MachineUserSchema } from '../../models/user/MachineUserSecret'
import { UserIdSchema } from '../../models/user/UserId'
import type { UserManagementService } from '../../UserManagement'
import { UserManagement } from '../../UserManagement'
import { ZitadelCreateApplication } from './models/application/CreateApplication'
import { CreateApplicationResponse } from './models/application/CreateApplicationResponse'
import { ZitadelResponseError } from './models/errors/UserNotFoundResponseZitadelError'
import { AddProjectRolesResponse } from './models/project/AddProjectRolesResponse'
import { ZitadelCreateProject } from './models/project/CreateProject'
import { CreateProjectResponse } from './models/project/CreateProjectResponse'
import { ProjectResponse } from './models/project/projectResponse'
import { ProjectRole } from './models/project/ProjectRole'
import { AddGrantMemberResponseZitadel } from './models/user/AddGrantMemberResponseZitadel'
import { CreateUserResponseZitadelDTO } from './models/user/CreateUserResponseZitadelDTO'
import { CurrentUserInfoResponseZitadel } from './models/user/CurrentUserInfoResponseZitadel'
import { CurrentUserProjectsWithRolesResponseZitadel } from './models/user/CurrentUserProjectsWithRolesResponseZitadel'
import { GetUserResponseZitadel } from './models/user/GetUserResponseZitadel'
import { LoginResponse } from './models/user/LoginResponse'
import { SearchUsersResponseZitadelDTO } from './models/user/SearchUsersResponseZitadelDTO'
import { SecretMachineResponse } from './models/user/SecretMachineResponse'
import { OpenIdClient } from './OidcClient'

export const makeZitadelImplementation: L.Layer<
  UserManagement,
  HttpClientError,
  Http.client.Client.Default | BaseClient
> = L.effect(
  UserManagement,
  T.gen(function* (_) {
    const client = yield* _(OpenIdClient)
    const TOKEN = yield* _(Config.string('ZITADEL_ACCESS_TOKEN'), T.catchAll(T.die))
    // const PROJECT_ID = yield* _(Config.string('ZITADEL_PROJECT_ID'), T.catchAll(T.die))
    const defaultClient = yield* _(Http.client.Client)

    const clientWithBaseUrl = defaultClient.pipe(
      Http.client.mapRequest(Http.request.prependUrl('http://localhost:8081')),
      Http.client.mapRequest(Http.request.setHeader('Authorization', `Bearer ${TOKEN}`)),
      Http.client.mapRequest(Http.request.setHeader('Content-Type', 'application/json')),
      Http.client.catchTags({
        RequestError: T.die,
        ResponseError: T.die
      })
    )

    const clientManagement = pipe(
      clientWithBaseUrl,
      Http.client.mapRequest(Http.request.updateUrl(oldUrl => {
        const newUrl = new URL(oldUrl)

        // Ajouter le segment '/management/v1'
        newUrl.pathname = '/management/v1' + newUrl.pathname

        const modifiedUrl = newUrl.toString()
        return modifiedUrl
      })),
      Http.client.catchTags({
        RequestError: T.die,
        ResponseError: T.die
      })
    )

    const createUser: UserManagementService['createUser'] = createUser =>
      T.gen(function* (_) {
        const body = yield* _(
          Http.body.json({
            email: { email: createUser.email },
            password: createUser.password,
            userName: createUser.userName,
            profile: { firstName: createUser.firstName, lastName: createUser.lastName }
          })
        )
        yield* _(T.logDebug('UserManagementService - createUser body', body))
        const postCreateUserRequest = Http.request.post('/users/human/_import', {
          acceptJson: true,
          body
        })
        yield* _(
          T.logDebug(
            'UserManagementService - createUser postCreateUserRequest',
            postCreateUserRequest
          )
        )
        const response = yield* _(clientManagement(postCreateUserRequest))
        const responseJson = yield* _(response.json)

        const createUserZitadel = yield* _(
          responseJson,
          Sc.decodeUnknown(CreateUserResponseZitadelDTO),
          T.tapError(() =>
            T.logError('UserManagementService - createUser decode response', responseJson)
          ),
          T.catchAll(() =>
            pipe(
              Sc.decodeUnknown(ZitadelResponseError)(responseJson),
              T.tap(T.logError),
              T.flatMap(userNotFound => {
                const result: T.Effect<
                  never,
                  UserAlreadyExist | ServerError | PasswordNotEnoughStrong
                > = userNotFound.code === 6 ?
                  T.fail(UserAlreadyExist.of(userNotFound.message)) :
                  userNotFound.code === 3 ?
                  T.fail(PasswordNotEnoughStrong.of(userNotFound.message)) :
                  T.fail(ServerError.of(userNotFound))
                return result
              })
            )
          )
        )

        return { userId: createUserZitadel.userId }
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          ParseError: T.die,
          BodyError: T.die,
          ServerError: T.die
        }),
        T.scoped
      )

    const addUserRolesToProject: UserManagementService['addUserRolesToProject'] = (
      userId,
      projectId,
      roles
    ) =>
      T.gen(function* (_) {
        const body = yield* _(
          Http.body.json({
            projectId,
            roleKeys: roles
          })
        )
        const request = Http.request.post(`/users/${userId}/grants`, {
          acceptJson: true,
          body
        })
        const response = yield* _(clientManagement(request))
        const responseJson = yield* _(response.json)

        yield* _(
          responseJson,
          Sc.decodeUnknown(AddGrantMemberResponseZitadel),
          T.tapError(() => T.logError(responseJson, Cause.fail(`addUserRolesToProject`)))
        )
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          BodyError: T.die,
          ParseError: T.die
        }),
        T.scoped
      )

    const createUserMachine: UserManagementService['createUserMachine'] = createUser =>
      T.gen(function* (_) {
        const body = yield* _(
          Http.body.json(createUser)
        )

        const postCreateUserRequest = Http.request.post('/users/machine', {
          acceptJson: true,
          body
        })

        const response = yield* _(clientManagement(postCreateUserRequest))
        const responseJson = yield* _(response.json)
        const createUserZitadel = yield* _(
          responseJson,
          Sc.decodeUnknown(CreateUserResponseZitadelDTO),
          T.tapError(() => T.logError(responseJson)),
          T.catchAll(() =>
            pipe(
              Sc.decodeUnknown(ZitadelResponseError)(responseJson),
              T.tap(T.logError),
              T.flatMap(userNotFound => {
                const result: T.Effect<never, UserAlreadyExist | ServerError> =
                  userNotFound.code === 6 ?
                    T.fail(UserAlreadyExist.of(userNotFound.message)) :
                    T.fail(ServerError.of(userNotFound))
                return result
              })
            )
          )
        )

        return { userId: createUserZitadel.userId }
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          ParseError: T.die,
          BodyError: T.die,
          ServerError: T.die
        }),
        T.scoped
      )

    const deleteUser: UserManagementService['deleteUser'] = userId =>
      T.gen(function* (_) {
        const deleteUserRequest = Http.request.del(`/management/v1/users/${userId}`)
        yield* _(clientWithBaseUrl(deleteUserRequest))
      }).pipe(T.scoped)

    const getUsers: UserManagementService['getUsers'] = T.gen(function* (_) {
      const postSearchUsersRequest = Http.request.post(`/users/_search`)
      const response = yield* _(clientManagement(postSearchUsersRequest))
      const responseInJson = yield* _(response.json)

      const parsed = Sc.decodeUnknown(SearchUsersResponseZitadelDTO)(responseInJson)
      const p = yield* _(parsed)
      return p.result
    }).pipe(
      T.catchTags({ ResponseError: T.die, ParseError: T.die }),
      T.scoped
    )

    const getUserById: UserManagementService['getUserById'] = userId =>
      T.gen(function* (_) {
        const getUserByIdRequest = Http.request.get(`/users/${userId}`)
        const response = yield* _(clientManagement(getUserByIdRequest))

        const responseInJson = yield* _(response.json)
        const userResponseZitadel = yield* _(
          Sc.decodeUnknown(GetUserResponseZitadel)(responseInJson),
          T.catchAll(() =>
            pipe(
              Sc.decodeUnknown(ZitadelResponseError)(responseInJson),
              T.tap(T.logError),
              T.flatMap(userNotFound => {
                const result: T.Effect<never, UserNotFoundError | ServerError> =
                  userNotFound.code === 5 ?
                    T.fail(UserNotFoundError.of(userNotFound)) :
                    T.fail(ServerError.of(userNotFound))
                return result
              })
            )
          )
        )
        return { userId: userResponseZitadel.user.id }
      }).pipe(
        T.catchTags({ ResponseError: T.die, ParseError: T.die, ServerError: T.die }),
        T.scoped
      )

    const getPersonalAccessTokenUser: UserManagementService['getUserPersonalAccessToken'] =
      userId =>
        T.gen(function* (_) {
          const body = yield* _(
            Http.body.json(
              {
                expirationDate: '3000-04-01T08:45:00.000000Z'
              }
            )
          )

          const request = Http.request.post(`/users/${userId}/pats`, {
            acceptJson: true,
            body
          })
          const response = yield* _(clientManagement(request))
          const responseJson = yield* _(response.json)

          const responseInJson = yield* _(
            responseJson,
            Sc.decodeUnknown(Sc.Struct({ token: Sc.String })),
            T.tapError(() => T.logError(responseJson))
          )

          return yield* _(Sc.decodeUnknown(AccessTokenSchema)(responseInJson.token))
        }).pipe(
          T.catchTags({ ResponseError: T.die, ParseError: T.die, BodyError: T.die }),
          T.scoped
        )

    const getUserByLoginName: UserManagementService['getUserByLoginName'] = loginName =>
      T.gen(function* (_) {
        const clientWithParams = Http.client.mapRequest(
          Http.request.appendUrlParam('loginName', loginName)
        )(
          clientManagement
        )
        const response = yield* _(
          clientWithParams(Http.request.get(`/global/users/_by_login_name`))
        )

        const responseInJson = yield* _(response.json)

        const userResponseZitadel = yield* _(
          Sc.decodeUnknown(GetUserResponseZitadel)(responseInJson),
          T.catchAll(() =>
            pipe(
              Sc.decodeUnknown(ZitadelResponseError)(responseInJson),
              T.tap(T.logError),
              T.flatMap(userNotFound => {
                const result: T.Effect<never, UserNotFoundError | ServerError> =
                  userNotFound.code === 5 ?
                    T.fail(UserNotFoundError.of(userNotFound)) :
                    T.fail(ServerError.of(userNotFound))
                return result
              })
            )
          )
        )
        return { userId: userResponseZitadel.user.id }
      }).pipe(
        T.catchTags({ ResponseError: T.die, ParseError: T.die, ServerError: T.die }),
        T.scoped
      )

    const getCurrentUserInfo: UserManagementService['getCurrentUserInfo'] = token =>
      T.gen(function* (_) {
        const getUserByIdRequest = Http.request.get(`/users/me`)

        const clientAuth1 = defaultClient.pipe(
          Http.client.mapRequest(Http.request.prependUrl('http://localhost:8081/auth/v1')),
          Http.client.mapRequest(Http.request.setHeader('Authorization', `Bearer ${token}`)),
          Http.client.mapRequest(Http.request.setHeader('Content-Type', 'application/json')),
          Http.client.catchTags({
            RequestError: T.die,
            ResponseError: T.die
          })
        )
        const response = yield* _(clientAuth1(getUserByIdRequest))
        const responseInJson = yield* _(response.json)

        const currentUserInfoResponseZitadel = yield* _(
          Sc.decodeUnknown(CurrentUserInfoResponseZitadel)(responseInJson)
        )

        return {
          userId: currentUserInfoResponseZitadel.user.id,
          userName: currentUserInfoResponseZitadel.user.userName,
          firstName: currentUserInfoResponseZitadel.user?.human?.profile.firstName,
          lastName: currentUserInfoResponseZitadel.user?.human?.profile.lastName,
          email: currentUserInfoResponseZitadel.user?.human?.email.email,
          phone: currentUserInfoResponseZitadel.user?.human?.phone.phone
        }
      }).pipe(
        T.catchTags(
          {
            ResponseError: T.die,
            ParseError: e =>
              T.gen(function* (_) {
                yield* _(T.logError(formatErrorSync(e)))
                return yield* _(T.die(e))
              })
          }
        ),
        T.scoped
      )

    const getCurrentUserProjectsWithRoles:
      UserManagementService['getCurrentUserProjectsWithRoles'] = token =>
        T.gen(
          function* (_) {
            const body = yield* _(
              Http.body.json({
                'query': {
                  'offset': '0',
                  'limit': 100,
                  'asc': true
                }
              })
            )

            const request = Http.request.post(`/usergrants/me/_search`, {
              acceptJson: true,
              body
            })

            const clientAuth1 = defaultClient.pipe(
              Http.client.mapRequest(Http.request.prependUrl('http://localhost:8081/auth/v1')),
              Http.client.mapRequest(Http.request.setHeader('Authorization', `Bearer ${token}`)),
              Http.client.mapRequest(Http.request.setHeader('Content-Type', 'application/json')),
              Http.client.catchTags({
                RequestError: T.die,
                ResponseError: T.die
              })
            )
            const response = yield* _(clientAuth1(request))
            const responseInJson = yield* _(response.json)
            const responseParsed = yield* _(
              Sc.decodeUnknown(CurrentUserProjectsWithRolesResponseZitadel)(responseInJson),
              T.tapError(() => T.logError(responseInJson))
            )

            return responseParsed.result ?
              responseParsed.result.map(result => ({
                projectId: result.projectId,
                projectName: result.projectName,
                roles: result.roles,
                roleKeys: result.roleKeys
              })) :
              []
          }
        ).pipe(
          T.catchTags(
            {
              BodyError: T.die,
              ResponseError: T.die,
              ParseError: e =>
                T.gen(function* (_) {
                  yield* _(T.logError(formatErrorSync(e)))
                  return yield* _(T.die(e))
                })
            }
          ),
          T.scoped
        )

    const login: UserManagementService['login'] = T.sync(() => {
      const nonce = generators.nonce()
      const codeVerifier = generators.codeVerifier()
      const codeChallenge = generators.codeChallenge(codeVerifier)

      // Store the nonce in the session or a secure cookie for later validation
      const authorizationUrl = client.authorizationUrl({
        scope: 'openid profile email',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        code_challenge_method: 'S256',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        code_challenge: codeChallenge,
        nonce
      })
      return { codeVerifier, nonce, authorizationUrl }
    })

    const createProject: UserManagementService['createProject'] = project =>
      T.gen(function* (_) {
        const zitadelProject = yield* _(
          Sc.decode(ZitadelCreateProject)({
            name: project.name,
            hasProjectCheck: true,
            projectRoleCheck: true,
            projectRoleAssertion: true
          })
        )

        const body = yield* _(
          Http.body.json(
            zitadelProject
          )
        )
        const request = Http.request.post(`/projects`, {
          acceptJson: true,
          body
        })
        const response = yield* _(clientManagement(request))
        const responseJson = yield* _(response.json)

        return yield* _(
          responseJson,
          Sc.decodeUnknown(CreateProjectResponse),
          T.tapError(() => T.logError(responseJson, Cause.fail(`createProject`))),
          T.flatMap(p => Sc.decodeUnknown(ProjectIdSchema)(p.id))
        )
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          BodyError: T.die,
          ParseError: T.die
        }),
        T.scoped
      )

    const createApplication: UserManagementService['createApplication'] = app =>
      T.gen(function* (_) {
        const zitadelApplication = yield* _(
          Sc.decode(ZitadelCreateApplication)(
            { authMethodTYpe: app.authMethodTYpe, name: app.name }
          )
        )

        const body = yield* _(
          Http.body.json(
            zitadelApplication
          )
        )
        const request = Http.request.post(`/projects/${app.projectId.toString()}/apps/api`, {
          acceptJson: true,
          body
        })
        const response = yield* _(clientManagement(request))
        const responseJson = yield* _(response.json)

        return yield* _(
          responseJson,
          Sc.decodeUnknown(CreateApplicationResponse),
          T.tapError(() => T.logError(responseJson)),
          T.flatMap(p => Sc.decodeUnknown(ApplicationIdSchema)(p.appId))
        )
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          BodyError: T.die,
          ParseError: T.die
        }),
        T.scoped
      )

    const loginAPIBasic: UserManagementService['loginAPIBasic'] = (
      { clientId, projectId, clientSecret }
    ) =>
      T.gen(function* (_) {
        const tokenEndPoint = 'http://localhost:8081/oauth/v2/token'
        const data = {
          grant_type: 'client_credentials',
          scope: `openid profile email urn:zitadel:iam:org:project:id:${projectId}:aud`
        }

        const params = Http.urlParams.fromInput(data)

        const clientWithBaseUrl = defaultClient.pipe(
          Http.client.mapRequest(Http.request.prependUrl(tokenEndPoint)),
          Http.client.mapRequest(Http.request.basicAuth(clientId, clientSecret)),
          Http.client.mapRequest(
            Http.request.setHeader('Content-Type', 'application/x-www-form-urlencoded')
          ),
          Http.client.mapRequest(Http.request.urlParamsBody(params)),
          Http.client.catchTags({
            RequestError: T.die,
            ResponseError: T.die
          })
        )

        const response = yield* _(clientWithBaseUrl(Http.request.post('')))
        const json = yield* _(response.json)
        return yield* _(
          Sc.decodeUnknown(LoginResponse)(json),
          T.tapError(() => T.logError(json)),
          T.flatMap(loginResponse =>
            Sc.decodeUnknown(AccessTokenSchema)(loginResponse.access_token)
          )
        )
      }).pipe(
        T.catchTags({
          ResponseError: T.die,

          ParseError: T.die
        }),
        T.scoped
      )

    const createSecretForMachineUser: UserManagementService['createSecretForMachineUser'] =
      userId =>
        T.gen(function* (_) {
          const postCreateUserRequest = Http.request.put(`/users/${userId}/secret`)

          const response = yield* _(clientManagement(postCreateUserRequest))

          const responseJson = yield* _(response.json)

          const machineUserSecret = yield* _(
            Sc.decodeUnknown(SecretMachineResponse)(responseJson),
            T.tapError(() => T.logError(responseJson)),
            T.flatMap(secret => Sc.decodeUnknown(MachineUserSchema)(secret.clientSecret))
          )

          return machineUserSecret
        }).pipe(
          T.catchTags({
            ResponseError: T.die,

            ParseError: T.die
          }),
          T.scoped
        )

    const addProjectRoles: UserManagementService['addProjectRoles'] = (roles, projectId) =>
      T.gen(function* (_) {
        const zitadelProjectRoles = yield* _(
          pipe(
            roles,
            A.map(r => ({ displayName: r.name, key: r.key })),
            Sc.decode(Sc.Array(ProjectRole))
          )
        )

        const body = yield* _(
          Http.body.json(
            { roles: zitadelProjectRoles }
          )
        )
        const request = Http.request.post(`/projects/${projectId}/roles/_bulk`, {
          acceptJson: true,
          body
        })

        const response = yield* _(clientManagement(request))
        const responseJson = yield* _(response.json)
        yield* _(
          Sc.decodeUnknown(AddProjectRolesResponse)(responseJson),
          T.tapError(() => T.logError(responseJson, Cause.fail(`addProjectRoles`)))
        )
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          BodyError: T.die,
          ParseError: T.die
        }),
        T.scoped
      )

    const getProjectRoles: UserManagementService['getProjectRoles'] = projectId =>
      T.gen(function* (_) {
        const request = Http.request.post(`/projects/${projectId}/roles/_search`, {
          acceptJson: true
        })

        const response = yield* _(clientManagement(request))
        const responseJson = yield* _(response.json)
        return yield* _(
          Sc.decodeUnknown(Sc.Struct({ result: Sc.Array(ProjectRole) }))(responseJson),
          T.tapError(() => T.logError(T.logError(responseJson, Cause.fail(`getProjectRoles`)))),
          T.map(({ result }) => result.map(role => ({ name: role.displayName, key: role.key })))
        )
      }).pipe(
        T.catchTags({
          ResponseError: T.die,

          ParseError: T.die
        }),
        T.scoped
      )

    const getUserProjectsWithRoles: UserManagementService['getUserProjectsWithRoles'] = userId =>
      T.gen(function* (_) {
        const body = yield* _(
          Http.body.json(
            {
              queries: [{ userIdQuery: { userId } }]
            }
          )
        )
        const request = Http.request.post(`/users/grants/_search`, {
          acceptJson: true,
          body
        })

        const response = yield* _(clientManagement(request))

        const responseInJson = yield* _(response.json)

        const responseParsed = yield* _(
          Sc.decodeUnknown(CurrentUserProjectsWithRolesResponseZitadel)(responseInJson),
          T.tapError(() => T.logError(responseInJson))
        )

        return responseParsed.result ?
          responseParsed.result.map(result => ({
            projectId: result.projectId,
            projectName: result.projectName,
            roles: result.roles,
            roleKeys: result.roleKeys
          })) :
          []
      }).pipe(
        T.catchTags(
          {
            BodyError: T.die,
            ResponseError: T.die,
            ParseError: e =>
              T.gen(function* (_) {
                yield* _(T.logError(formatErrorSync(e)))
                return yield* _(T.die(e))
              })
          }
        ),
        T.scoped
      )

    const getAllProjects: UserManagementService['getAllProjects'] = T.gen(function* (_) {
      const body = yield* _(
        Http.body.json(
          {
            query: {
              offset: '0',
              limit: 100,
              asc: true
            }
          }
        )
      )
      const request = Http.request.post(`/projects/_search`, {
        acceptJson: true,
        body
      })

      const response = yield* _(clientManagement(request))

      const responseInJson = yield* _(response.json)

      const projectsFromZitadel = yield* _(
        responseInJson,
        Sc.decodeUnknown(ProjectResponse),
        T.tapError(() => T.logError(responseInJson))
      )

      return projectsFromZitadel.result ?
        projectsFromZitadel.result.map(
          project => ({
            id: project.id,
            name: project.name
          })
        ) :
        []
    }).pipe(
      T.catchTags({
        BodyError: T.die,
        ResponseError: T.die,
        ParseError: e =>
          T.gen(function* (_) {
            yield* _(T.logError(formatErrorSync(e)))
            return yield* _(T.die(e))
          })
      }),
      T.scoped
    )

    const deleteTestProjects: UserManagementService['deleteTestProjects'] = T.gen(function* (_) {
      const body = yield* _(
        Http.body.json(
          {
            query: {
              offset: '0',
              limit: 1000,
              asc: true
            },
            queries: [
              {
                nameQuery: {
                  name: 'test_',
                  method: 'TEXT_QUERY_METHOD_STARTS_WITH'
                }
              }
            ]
          }
        )
      )
      const requestSearch = Http.request.post(`/projects/_search`, {
        acceptJson: true,
        body
      })

      const response = yield* _(clientManagement(requestSearch))
      const responseInJson = yield* _(response.json)
      yield* _(
        T.logDebug('UserManagementService - deleteTestProjects projects to delete', responseInJson)
      )
      yield* _(
        Sc.decodeUnknown(
          Sc.Struct({
            result: Sc.optional(Sc.Array(Sc.Struct({ id: ProjectIdSchema, name: Sc.String })))
          })
        )(responseInJson),
        T.tapError(() =>
          T.logError(
            responseInJson,
            Cause.fail(`deleteTestProjects => response of searchProjects`)
          )
        ),
        T.map(r => r.result ?? []),
        T.flatMap(results =>
          pipe(
            results,
            T.forEach(result => {
              if (result.name !== 'ZITADEL' && result.name !== 'POC Project') {
                const requestDelete = Http.request.del(`/projects/${result.id}`)
                return clientManagement(requestDelete)
              }
              return T.void
            })
          )
        )
      )
    }).pipe(
      T.catchTags(
        {
          BodyError: T.die,
          ResponseError: T.die,
          ParseError: e =>
            T.gen(function* (_) {
              yield* _(T.logError(formatErrorSync(e)))
              return yield* _(T.die(e))
            })
        }
      ),
      T.scoped
    )

    const deleteTestUsers: UserManagementService['deleteTestUsers'] = T.gen(function* (_) {
      const body = yield* _(
        Http.body.json(
          {
            query: {
              offset: '0',
              limit: 1000,
              asc: true
            },
            queries: [
              {
                userNameQuery: {
                  userName: 'test_',
                  method: 'TEXT_QUERY_METHOD_STARTS_WITH'
                }
              }
            ]
          }
        )
      )
      const requestSearch = Http.request.post(`/users/_search`, {
        acceptJson: true,
        body
      })

      const response = yield* _(clientManagement(requestSearch))
      const responseInJson = yield* _(response.json)

      yield* _(
        responseInJson,
        Sc.decodeUnknown(
          Sc.Struct({
            result: Sc.Array(Sc.Struct({ id: UserIdSchema, userName: Sc.String })).pipe(
              Sc.propertySignature,
              Sc.withConstructorDefault(() => [])
            )
          })
        ),
        T.tapError(() =>
          T.logError(
            responseInJson,
            Cause.fail(`deleteTestUsers => response of searchUsers`)
          )
        ),
        T.map(r => r.result),
        T.flatMap(results =>
          pipe(
            results,
            T.forEach(result => {
              if (
                result.userName !== 'zitadel-admin@zitadel.localhost' && result.userName !== 'Adam'
              ) {
                const requestDelete = Http.request.del(`/users/${result.id}`)
                return clientManagement(requestDelete)
              }
              return T.void
            })
          )
        )
      )
    }).pipe(
      catchTags({
        BodyError: T.die,
        ResponseError: T.die,
        ParseError: T.die
      }),
      T.scoped
    )

    return UserManagement.of({
      deleteTestUsers,
      deleteTestProjects,
      getAllProjects,
      getUserProjectsWithRoles,
      getProjectRoles,
      addProjectRoles,
      createSecretForMachineUser,
      createUserMachine,
      loginAPIBasic,
      createApplication,
      createProject,
      addUserRolesToProject,
      getUsers,
      createUser,
      deleteUser,
      getUserById,
      getUserByLoginName,
      getCurrentUserInfo,
      getCurrentUserProjectsWithRoles,
      login,
      getUserPersonalAccessToken: getPersonalAccessTokenUser
    })
  })
)
