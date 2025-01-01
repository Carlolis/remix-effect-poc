import { Cause, Config, Effect as T, Layer as L, pipe, Schema as Sc } from 'effect'
import * as A from 'effect/Array'
import { catchTags } from 'effect/Effect'
import type { BaseClient } from 'openid-client'
import { generators } from 'openid-client'

import { HttpClient, HttpClientRequest } from '@effect/platform'
import { HttpClientError } from '@effect/platform/HttpClientError'
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
  HttpClient.HttpClient | BaseClient
> = L.effect(
  UserManagement,
  T.gen(function* () {
    const client = yield* OpenIdClient
    const TOKEN = yield* pipe(
      Config.string('ZITADEL_ACCESS_TOKEN'),
      T.tap(T.log),
      T.catchAll(T.die)
    )
    // const PROJECT_ID = yield* pipe(Config.string('ZITADEL_PROJECT_ID'), T.catchAll(T.die))
    const defaultClient = yield* HttpClient.HttpClient

    const clientWithBaseUrl = defaultClient.pipe(
      HttpClient.mapRequest(HttpClientRequest.prependUrl('http://localhost:8081')),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader('Authorization', `Bearer ${TOKEN}`)
      ),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader('Content-Type', 'application/json')
      ),
      HttpClient.catchTags({
        RequestError: T.die,
        ResponseError: T.die
      })
    )

    const clientManagement = pipe(
      clientWithBaseUrl,
      HttpClient.mapRequest(
        HttpClientRequest.updateUrl(oldUrl => {
          const newUrl = new URL(oldUrl)

          // Ajouter le segment '/management/v1'
          newUrl.pathname = '/management/v1' + newUrl.pathname

          const modifiedUrl = newUrl.toString()
          return modifiedUrl
        })
      )
    )

    const createUser: UserManagementService['createUser'] = createUser =>
      T.gen(function* () {
        const body = {
          email: { email: createUser.email },
          password: createUser.password,
          userName: createUser.userName,
          profile: {
            firstName: createUser.firstName,
            lastName: createUser.lastName
          }
        }
        const bodyRequest = HttpClientRequest.bodyJson({
          email: { email: createUser.email },
          password: createUser.password,
          userName: createUser.userName,
          profile: {
            firstName: createUser.firstName,
            lastName: createUser.lastName
          }
        })
        yield* T.logDebug('UserManagementService - createUser body', body)
        const postCreateUserRequest = yield* HttpClientRequest.post(
          '/users/human/_import'
        ).pipe(
          bodyRequest
        )
        yield* T.logDebug(
          'UserManagementService - createUser postCreateUserRequest',
          postCreateUserRequest
        )
        const response = yield* clientManagement.execute(postCreateUserRequest)
        const responseJson = yield* response.json

        const createUserZitadel = yield* pipe(
          responseJson,
          Sc.decodeUnknown(CreateUserResponseZitadelDTO),
          T.tapError(() =>
            T.logError(
              'UserManagementService - createUser decode response',
              responseJson
            )
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
          HttpBodyError: T.die,
          ServerError: T.die
        }),
        T.scoped
      )

    const addUserRolesToProject: UserManagementService['addUserRolesToProject'] = (
      userId,
      projectId,
      roles
    ) =>
      T.gen(function* () {
        const body = HttpClientRequest.bodyJson({
          projectId,
          roleKeys: roles
        })
        const request = yield* HttpClientRequest.post(`/users/${userId}/grants`).pipe(
          body
        )
        const response = yield* clientManagement.execute(request)
        const responseJson = yield* response.json

        yield* pipe(
          responseJson,
          Sc.decodeUnknown(AddGrantMemberResponseZitadel),
          T.tapError(() => T.logError(responseJson, Cause.fail(`addUserRolesToProject`)))
        )
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          HttpBodyError: T.die,
          ParseError: T.die
        }),
        T.scoped
      )

    const createUserMachine: UserManagementService['createUserMachine'] = createUser =>
      T.gen(function* () {
        const body = HttpClientRequest.bodyJson(createUser)

        const postCreateUserRequest = yield* HttpClientRequest.post('/users/machine').pipe(
          body
        )

        const response = yield* clientManagement.execute(postCreateUserRequest)
        const responseJson = yield* response.json
        const createUserZitadel = yield* pipe(
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
          HttpBodyError: T.die,
          ServerError: T.die
        }),
        T.scoped
      )

    const deleteUser: UserManagementService['deleteUser'] = userId =>
      T.gen(function* () {
        const deleteUserRequest = HttpClientRequest.del(
          `/management/v1/users/${userId}`
        )
        yield* clientWithBaseUrl.execute(deleteUserRequest)
      }).pipe(T.scoped)

    const getUsers: UserManagementService['getUsers'] = T.gen(function* () {
      const postSearchUsersRequest = HttpClientRequest.post(`/users/_search`)
      const response = yield* clientManagement.execute(postSearchUsersRequest)
      const responseInJson = yield* response.json

      const parsed = Sc.decodeUnknown(SearchUsersResponseZitadelDTO)(
        responseInJson
      )
      const p = yield* parsed
      return p.result
    }).pipe(T.catchTags({ ResponseError: T.die, ParseError: T.die }), T.scoped)

    const getUserById: UserManagementService['getUserById'] = userId =>
      T.gen(function* () {
        const getUserByIdRequest = HttpClientRequest.get(`/users/${userId}`)
        const response = yield* clientManagement.execute(getUserByIdRequest)

        const responseInJson = yield* response.json
        const userResponseZitadel = yield* pipe(
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
        T.catchTags({
          ResponseError: T.die,
          ParseError: T.die,
          ServerError: T.die
        }),
        T.scoped
      )

    const getPersonalAccessTokenUser: UserManagementService['getUserPersonalAccessToken'] =
      userId =>
        T.gen(function* () {
          const body = HttpClientRequest.bodyJson({
            expirationDate: '3000-04-01T08:45:00.000000Z'
          })

          const request = yield* HttpClientRequest.post(`/users/${userId}/pats`).pipe(
            body
          )
          const response = yield* clientManagement.execute(request)
          const responseJson = yield* response.json

          const responseInJson = yield* pipe(
            responseJson,
            Sc.decodeUnknown(Sc.Struct({ token: Sc.String })),
            T.tapError(() => T.logError(responseJson))
          )

          return yield* Sc.decodeUnknown(AccessTokenSchema)(
            responseInJson.token
          )
        }).pipe(
          T.catchTags({
            ResponseError: T.die,
            ParseError: T.die,
            HttpBodyError: T.die
          }),
          T.scoped
        )

    const getUserByLoginName: UserManagementService['getUserByLoginName'] = loginName =>
      T.gen(function* () {
        const clientWithParams = HttpClient.mapRequest(
          HttpClientRequest.appendUrlParam('loginName', loginName)
        )(clientManagement)
        const response = yield* clientWithParams.execute(
          HttpClientRequest.get(`/global/users/_by_login_name`)
        )

        const responseInJson = yield* response.json

        const userResponseZitadel = yield* pipe(
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
        T.catchTags({
          ResponseError: T.die,
          ParseError: T.die,
          ServerError: T.die
        }),
        T.scoped
      )

    const getCurrentUserInfo: UserManagementService['getCurrentUserInfo'] = token =>
      T.gen(function* () {
        const getUserByIdRequest = HttpClientRequest.get(`/users/me`)

        const clientAuth1 = defaultClient.pipe(
          HttpClient.mapRequest(
            HttpClientRequest.prependUrl('http://localhost:8081/auth/v1')
          ),
          HttpClient.mapRequest(
            HttpClientRequest.setHeader('Authorization', `Bearer ${token}`)
          ),
          HttpClient.mapRequest(
            HttpClientRequest.setHeader('Content-Type', 'application/json')
          ),
          HttpClient.catchTags({
            RequestError: T.die,
            ResponseError: T.die
          })
        )
        const response = yield* clientAuth1.execute(getUserByIdRequest)
        const responseInJson = yield* response.json

        const currentUserInfoResponseZitadel = yield* Sc.decodeUnknown(
          CurrentUserInfoResponseZitadel
        )(responseInJson)

        return {
          userId: currentUserInfoResponseZitadel.user.id,
          userName: currentUserInfoResponseZitadel.user.userName,
          firstName: currentUserInfoResponseZitadel.user?.human?.profile.firstName,
          lastName: currentUserInfoResponseZitadel.user?.human?.profile.lastName,
          email: currentUserInfoResponseZitadel.user?.human?.email.email,
          phone: currentUserInfoResponseZitadel.user?.human?.phone.phone
        }
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          ParseError: e =>
            T.gen(function* () {
              yield* T.logError(e.message)
              return yield* T.die(e)
            })
        }),
        T.scoped
      )

    const getCurrentUserProjectsWithRoles:
      UserManagementService['getCurrentUserProjectsWithRoles'] = token =>
        T.gen(function* () {
          const body = HttpClientRequest.bodyJson({
            query: {
              offset: '0',
              limit: 100,
              asc: true
            }
          })

          const request = yield* HttpClientRequest.post(`/usergrants/me/_search`).pipe(
            body
          )

          const clientAuth1 = defaultClient.pipe(
            HttpClient.mapRequest(
              HttpClientRequest.prependUrl('http://localhost:8081/auth/v1')
            ),
            HttpClient.mapRequest(
              HttpClientRequest.setHeader('Authorization', `Bearer ${token}`)
            ),
            HttpClient.mapRequest(
              HttpClientRequest.setHeader('Content-Type', 'application/json')
            ),
            HttpClient.catchTags({
              RequestError: T.die,
              ResponseError: T.die
            })
          )
          const response = yield* clientAuth1.execute(request)
          const responseInJson = yield* response.json
          const responseParsed = yield* pipe(
            Sc.decodeUnknown(CurrentUserProjectsWithRolesResponseZitadel)(
              responseInJson
            ),
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
          T.catchTags({
            HttpBodyError: T.die,
            ResponseError: T.die,
            ParseError: e =>
              T.gen(function* () {
                yield* T.logError(e.message)
                return yield* T.die(e)
              })
          }),
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
      T.gen(function* () {
        const zitadelProject = yield* Sc.decode(ZitadelCreateProject)({
          name: project.name,
          hasProjectCheck: true,
          projectRoleCheck: true,
          projectRoleAssertion: true
        })

        const body = HttpClientRequest.bodyJson(zitadelProject)
        const request = yield* HttpClientRequest.post(`/projects`).pipe(
          body
        )
        const response = yield* clientManagement.execute(request)
        const responseJson = yield* response.json

        return yield* pipe(
          responseJson,
          Sc.decodeUnknown(CreateProjectResponse),
          T.tapError(() => T.logError(responseJson, Cause.fail(`createProject`))),
          T.flatMap(p => Sc.decodeUnknown(ProjectIdSchema)(p.id))
        )
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          HttpBodyError: T.die,
          ParseError: T.die
        }),
        T.scoped
      )

    const createApplication: UserManagementService['createApplication'] = app =>
      T.gen(function* () {
        const zitadelApplication = yield* Sc.decode(ZitadelCreateApplication)({
          authMethodTYpe: app.authMethodTYpe,
          name: app.name
        })

        const body = HttpClientRequest.bodyJson(zitadelApplication)
        const request = yield* HttpClientRequest.post(
          `/projects/${app.projectId.toString()}/apps/api`
        ).pipe(
          body
        )
        const response = yield* clientManagement.execute(request)
        const responseJson = yield* response.json

        return yield* pipe(
          responseJson,
          Sc.decodeUnknown(CreateApplicationResponse),
          T.tapError(() => T.logError(responseJson)),
          T.flatMap(p => Sc.decodeUnknown(ApplicationIdSchema)(p.appId))
        )
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          HttpBodyError: T.die,
          ParseError: T.die
        }),
        T.scoped
      )

    const loginAPIBasic: UserManagementService['loginAPIBasic'] = ({
      clientId,
      projectId,
      clientSecret
    }) =>
      T.gen(function* () {
        const tokenEndPoint = 'http://localhost:8081/oauth/v2/token'
        const data = {
          grant_type: 'client_credentials',
          scope: `openid profile email urn:zitadel:iam:org:project:id:${projectId}:aud`
        }

        const params = HttpClientRequest.setUrlParams(data)

        const clientWithBaseUrl = defaultClient.pipe(
          HttpClient.mapRequest(HttpClientRequest.prependUrl(tokenEndPoint)),
          HttpClient.mapRequest(
            HttpClientRequest.basicAuth(clientId, clientSecret)
          ),
          HttpClient.mapRequest(
            HttpClientRequest.setHeader(
              'Content-Type',
              'application/x-www-form-urlencoded'
            )
          ),
          HttpClient.mapRequest(params),
          HttpClient.catchTags({
            RequestError: T.die,
            ResponseError: T.die
          })
        )

        const response = yield* clientWithBaseUrl.execute(HttpClientRequest.post(''))
        const json = yield* response.json
        return yield* pipe(
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
        T.gen(function* () {
          const postCreateUserRequest = HttpClientRequest.put(
            `/users/${userId}/secret`
          )

          const response = yield* clientManagement.execute(postCreateUserRequest)

          const responseJson = yield* response.json

          const machineUserSecret = yield* pipe(
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

    const addProjectRoles: UserManagementService['addProjectRoles'] = (
      roles,
      projectId
    ) =>
      T.gen(function* () {
        const zitadelProjectRoles = yield* pipe(
          roles,
          A.map(r => ({ displayName: r.name, key: r.key })),
          Sc.decode(Sc.Array(ProjectRole))
        )

        const body = HttpClientRequest.bodyJson({ roles: zitadelProjectRoles })
        const request = yield* HttpClientRequest.post(
          `/projects/${projectId}/roles/_bulk`
        ).pipe(
          body
        )

        const response = yield* clientManagement.execute(request)
        const responseJson = yield* response.json
        yield* pipe(
          Sc.decodeUnknown(AddProjectRolesResponse)(responseJson),
          T.tapError(() => T.logError(responseJson, Cause.fail(`addProjectRoles`)))
        )
      }).pipe(
        T.catchTags({
          ResponseError: T.die,
          HttpBodyError: T.die,
          ParseError: T.die
        }),
        T.scoped
      )

    const getProjectRoles: UserManagementService['getProjectRoles'] = projectId =>
      T.gen(function* () {
        const request = HttpClientRequest.post(
          `/projects/${projectId}/roles/_search`
        )

        const response = yield* clientManagement.execute(request)
        const responseJson = yield* response.json
        return yield* pipe(
          Sc.decodeUnknown(Sc.Struct({ result: Sc.Array(ProjectRole) }))(
            responseJson
          ),
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
      T.gen(function* () {
        const body = HttpClientRequest.bodyJson({
          queries: [{ userIdQuery: { userId } }]
        })
        const request = yield* HttpClientRequest.post(`/users/grants/_search`).pipe(
          body
        )

        const response = yield* clientManagement.execute(request)

        const responseInJson = yield* response.json

        const responseParsed = yield* pipe(
          Sc.decodeUnknown(CurrentUserProjectsWithRolesResponseZitadel)(
            responseInJson
          ),
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
        T.catchTags({
          HttpBodyError: T.die,
          ResponseError: T.die,
          ParseError: e =>
            T.gen(function* () {
              yield* T.logError(e.message)
              return yield* T.die(e)
            })
        }),
        T.scoped
      )

    const getAllProjects: UserManagementService['getAllProjects'] = () =>
      T.gen(
        function* () {
          const body = HttpClientRequest.bodyJson({
            query: {
              offset: '0',
              limit: 100,
              asc: true
            }
          })
          const request = yield* HttpClientRequest.post(`/projects/_search`).pipe(
            body
          )

          const response = yield* clientManagement.execute(request)

          const responseInJson = yield* response.json
          console.log('responseInJson', responseInJson)
          const projectsFromZitadel = yield* pipe(
            responseInJson,
            Sc.decodeUnknown(ProjectResponse),
            T.tap(T.logInfo),
            T.tapError(() => T.logError(responseInJson))
          )

          return projectsFromZitadel.result ?
            projectsFromZitadel.result.map(project => ({
              id: project.id,
              name: project.name
            })) :
            []
        }
      ).pipe(
        T.catchTags({
          HttpBodyError: T.die,
          ResponseError: T.die,
          ParseError: e =>
            T.gen(function* () {
              yield* T.logError(e.message)
              return yield* T.die(e)
            })
        }),
        T.scoped
      )

    const deleteTestProjects: UserManagementService['deleteTestProjects'] = T.gen(function* () {
      const body = HttpClientRequest.bodyJson({
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
      })
      const requestSearch = yield* HttpClientRequest.post(`/projects/_search`).pipe(
        body
      )

      const response = yield* clientManagement.execute(requestSearch)
      const responseInJson = yield* response.json
      yield* T.logDebug(
        'UserManagementService - deleteTestProjects projects to delete',
        responseInJson
      )
      yield* pipe(
        Sc.decodeUnknown(
          Sc.Struct({
            result: Sc.optional(
              Sc.Array(Sc.Struct({ id: ProjectIdSchema, name: Sc.String }))
            )
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
              if (
                result.name !== 'ZITADEL'
                && result.name !== 'POC Project'
              ) {
                const requestDelete = HttpClientRequest.del(
                  `/projects/${result.id}`
                )
                return clientManagement.execute(requestDelete)
              }
              return T.void
            })
          )
        )
      )
    }).pipe(
      T.catchTags({
        HttpBodyError: T.die,
        ResponseError: T.die,
        ParseError: e =>
          T.gen(function* () {
            yield* T.logError(e.message)
            return yield* T.die(e)
          })
      }),
      T.scoped
    )

    const deleteTestUsers: UserManagementService['deleteTestUsers'] = T.gen(
      function* () {
        const body = HttpClientRequest.bodyJson({
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
        })
        const requestSearch = yield* HttpClientRequest.post(`/users/_search`).pipe(
          body
        )

        const response = yield* clientManagement.execute(requestSearch)
        const responseInJson = yield* response.json

        yield* pipe(
          responseInJson,
          Sc.decodeUnknown(
            Sc.Struct({
              result: Sc.Array(
                Sc.Struct({ id: UserIdSchema, userName: Sc.String })
              ).pipe(
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
                  result.userName !== 'zitadel-admin@zitadel.localhost'
                  && result.userName !== 'Adam'
                ) {
                  const requestDelete = HttpClientRequest.del(`/users/${result.id}`)
                  return clientManagement.execute(requestDelete)
                }
                return T.void
              })
            )
          )
        )
      }
    ).pipe(
      catchTags({
        HttpBodyError: T.die,
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
