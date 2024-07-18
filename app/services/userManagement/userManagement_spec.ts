import * as Http from '@effect/platform/HttpClient'
import { XTest } from '@rebaze-fr/util-test-helpers-next'
import { Effect as T, Layer as L, pipe } from 'effect'
import * as A from 'effect/Array'
import * as O from 'effect/Option'
import type { Config } from 'unique-names-generator'
import { names, uniqueNamesGenerator } from 'unique-names-generator'
import { afterAll, describe, expect } from 'vitest'

import type { CreateApplication } from './models/application/CreateApplication'
import type { ProjectId } from './models/project/ProjectId'
import type { CreateUser } from './models/user/CreateUser'
import { UserManagement } from './UserManagement'

const uniqueNamesCustomConfig = {
  dictionaries: [names, names],
  separator: '_',
  length: 2
}

const uniqueTestNamesGenerator = (customConfig: Config) =>
  'test_' + uniqueNamesGenerator(customConfig)

export const userManagementTest = T.gen(function* (_) {
  const userManagement = yield* _(UserManagement)

  const layerUserManagementService = L.succeed(UserManagement)(userManagement)

  const { It } = XTest.withRuntime(
    pipe(Http.client.layer, L.provideMerge(layerUserManagementService))
  )

  afterAll(() =>
    T.gen(function* (_) {
      const userManagementService = yield* _(UserManagement)
      yield* _(userManagementService.deleteTestProjects)
      yield* _(userManagementService.deleteTestUsers)
    }).pipe(T.provide(layerUserManagementService), T.runPromise)
  )

  describe('User management', { timeout: 10000 }, () => {
    const createRandomProject = () => ({
      name: uniqueTestNamesGenerator(uniqueNamesCustomConfig)
    })

    const createRandomApplication = (projectId: ProjectId): CreateApplication => ({
      name: uniqueTestNamesGenerator(uniqueNamesCustomConfig),
      projectId,
      authMethodTYpe: ['API_AUTH_METHOD_TYPE_PRIVATE_KEY_JWT' as const]
    })

    const createRandomUser = (config: Config): CreateUser => {
      const name = uniqueTestNamesGenerator(config)
      return {
        email: `${name}@email.com`,
        firstName: name,
        lastName: uniqueTestNamesGenerator(config),
        password: 'password1@A',
        userName: name
      }
    }

    const createRandomUserMachine = () => ({
      name: uniqueTestNamesGenerator(uniqueNamesCustomConfig),
      userName: uniqueTestNamesGenerator(uniqueNamesCustomConfig)
    })

    It(
      'should create user',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const userData = createRandomUser(uniqueNamesCustomConfig)

        const user = yield* _(userManagementService.createUser(userData))

        expect(user).not.equal(undefined)
      })
    )

    It.skip(
      'should not create user if password has not uppercase letter',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const userData = createRandomUser(uniqueNamesCustomConfig)

        const user = yield* _(
          userManagementService.createUser({ ...userData, password: 'password1' }),
          T.catchTag('PasswordNotEnoughStrong', e => T.succeed(e._tag))
        )

        expect(user).equal('PasswordNotEnoughStrong')
      })
    )

    It(
      'should not be possible to create two user with same userName',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const userData = createRandomUser(uniqueNamesCustomConfig)
        yield* _(userManagementService.createUser(userData))

        const userData2 = {
          ...createRandomUser(uniqueNamesCustomConfig),
          userName: userData.userName
        }

        const userAlreadyExistError = yield* _(
          userManagementService.createUser(userData2),
          T.catchTag('UserAlreadyExist', e => T.succeed(e._tag))
        )

        expect(userAlreadyExistError).equal('UserAlreadyExist')
      })
    )

    It(
      'should get user by ID',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const userData = createRandomUser(uniqueNamesCustomConfig)
        const { userId } = yield* _(userManagementService.createUser(userData))
        const UserOutputDTO = yield* _(userManagementService.getUserById(userId))

        expect(UserOutputDTO).not.equal(undefined)
      })
    )

    It(
      'should get user by loginName',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const userData = createRandomUser(uniqueNamesCustomConfig)
        yield* _(userManagementService.createUser(userData))
        const UserOutputDTO = yield* _(
          userManagementService.getUserByLoginName(userData.userName)
        )

        expect(UserOutputDTO).not.equal(undefined)
      })
    )

    It(
      'should delete user',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const userData = createRandomUser(uniqueNamesCustomConfig)
        const createUserD = yield* _(userManagementService.createUser(userData))

        yield* _(userManagementService.deleteUser(createUserD.userId))
        const getUserErrorResponse = yield* _(
          userManagementService.getUserById(createUserD.userId),
          T.catchTag('UserNotFoundError', e => T.succeed(e._tag))
        )

        expect(getUserErrorResponse).equals('UserNotFoundError')
      })
    )

    It(
      'should get all projects',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const projectData1 = createRandomProject()
        const projectData2 = createRandomProject()
        const project1Id = yield* _(userManagementService.createProject(projectData1))
        const project2Id = yield* _(userManagementService.createProject(projectData2))

        const projects = yield* _(userManagementService.getAllProjects)

        expect(projects).not.equal(undefined)
        expect(
          pipe(
            projects,
            A.findFirst(p => p.id === project1Id),
            O.isSome
          )
        ).equals(true)
        expect(
          pipe(
            projects,
            A.findFirst(p => p.id === project2Id),
            O.isSome
          )
        ).equals(true)
      })
    )

    It(
      'should create a project',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const projectData = createRandomProject()
        const project = yield* _(userManagementService.createProject(projectData))

        expect(project).not.equal(undefined)
      })
    )

    It(
      'should create a application',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const projectData = createRandomProject()
        const projectId = yield* _(userManagementService.createProject(projectData))

        const applicationData = createRandomApplication(projectId)
        const applicationId = yield* _(userManagementService.createApplication(applicationData))
        expect(applicationId).not.equal(undefined)
      })
    )

    It(
      'should log in with machine user',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const userMachine = createRandomUserMachine()
        const clientId = yield* _(
          userManagementService.createUserMachine(userMachine),
          T.map(r => r.userId)
        )

        const projectData = createRandomProject()
        const projectId = yield* _(userManagementService.createProject(projectData))

        const applicationId = yield* _(
          userManagementService.createApplication({
            name: uniqueTestNamesGenerator(uniqueNamesCustomConfig),
            projectId,
            authMethodTYpe: ['API_AUTH_METHOD_TYPE_BASIC' as const]
          })
        )
        const clientSecret = yield* _(userManagementService.createSecretForMachineUser(clientId))

        const accessToken = yield* _(
          userManagementService.loginAPIBasic({
            clientId: userMachine.userName,
            projectId: applicationId.toString(),
            clientSecret
          })
        )
        expect(accessToken).not.equal(undefined)
      })
    )

    It(
      'should add roles to a project ',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const projectData = createRandomProject()
        const projectId = yield* _(userManagementService.createProject(projectData))
        const roles = [{ key: 'Admin', name: 'Admin' }, { key: 'Customer', name: 'Customer' }]
        yield* _(userManagementService.addProjectRoles(roles, projectId))
        const rolesCreated = yield* _(userManagementService.getProjectRoles(projectId))
        expect(roles).not.equal(rolesCreated)
      })
    )

    It(
      'should get current user info',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const userMachine = createRandomUserMachine()
        const userId = yield* _(
          userManagementService.createUserMachine(userMachine),
          T.map(r => r.userId)
        )
        const userPAT = yield* _(userManagementService.getUserPersonalAccessToken(userId))

        const userInfo = yield* _(userManagementService.getCurrentUserInfo(userPAT))

        expect(userInfo).not.equal(undefined)
      })
    )

    It(
      'should get current user Projects with Roles',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const userMachine = createRandomUserMachine()
        const userId = yield* _(
          userManagementService.createUserMachine(userMachine),
          T.map(r => r.userId)
        )

        const project1Data = createRandomProject()
        const project1Id = yield* _(userManagementService.createProject(project1Data))

        const project2Data = createRandomProject()
        const project2Id = yield* _(userManagementService.createProject(project2Data))

        const roles = [{ key: 'Admin', name: 'Admin' }, { key: 'Customer', name: 'Customer' }]
        yield* _(userManagementService.addProjectRoles(roles, project1Id))
        yield* _(userManagementService.addProjectRoles(roles, project2Id))

        yield* _(userManagementService.addUserRolesToProject(userId, project1Id, ['Admin']))
        yield* _(userManagementService.addUserRolesToProject(userId, project2Id, ['Customer']))

        const userPAT = yield* _(userManagementService.getUserPersonalAccessToken(userId))
        const userProjectsWithRoles = yield* _(
          userManagementService.getCurrentUserProjectsWithRoles(userPAT)
        )

        expect(userProjectsWithRoles).not.equal(undefined)

        expect(
          pipe(
            userProjectsWithRoles,
            A.findFirst(r =>
              r.projectId === project1Id && r.roles !== undefined && r.roles.includes('Admin')
            ),
            O.isSome
          )
        ).equals(true)
        expect(
          pipe(
            userProjectsWithRoles,
            A.findFirst(r =>
              r.projectId === project2Id && r.roles !== undefined && r.roles.includes('Customer')
            ),
            O.isSome
          )
        ).equals(true)

        expect(userProjectsWithRoles).length(2)
      })
    )

    It(
      'should get user Projects with Roles',
      T.gen(function* (_) {
        const userManagementService = yield* _(UserManagement)

        const userMachine = createRandomUserMachine()
        const userId = yield* _(
          userManagementService.createUserMachine(userMachine),
          T.map(r => r.userId)
        )

        const project1Data = createRandomProject()
        const project1Id = yield* _(userManagementService.createProject(project1Data))

        const project2Data = createRandomProject()
        const project2Id = yield* _(userManagementService.createProject(project2Data))

        const roles = [{ key: 'Admin', name: 'Admin' }, { key: 'Customer', name: 'Customer' }]
        yield* _(userManagementService.addProjectRoles(roles, project1Id))
        yield* _(userManagementService.addProjectRoles(roles, project2Id))

        yield* _(userManagementService.addUserRolesToProject(userId, project1Id, ['Admin']))
        yield* _(userManagementService.addUserRolesToProject(userId, project2Id, ['Customer']))

        const userProjectsWithRoles = yield* _(
          userManagementService.getUserProjectsWithRoles(userId)
        )

        expect(userProjectsWithRoles).not.equal(undefined)

        expect(
          pipe(
            userProjectsWithRoles,
            A.findFirst(r => r.projectId === project1Id && r.roleKeys.includes('Admin')),
            O.isSome
          )
        ).equals(true)
        expect(
          pipe(
            userProjectsWithRoles,
            A.findFirst(r =>
              r.projectId === project2Id
              && r.roleKeys.includes('Customer')
            ),
            O.isSome
          )
        ).equals(true)

        expect(userProjectsWithRoles).length(2)
      })
    )
  })
})
