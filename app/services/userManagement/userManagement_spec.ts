import { FetchHttpClient } from '@effect/platform'
import { XTest } from '@rebaze-fr/util-test-helpers-next'
import { Effect as T, Layer as L, pipe, Schema as Sc } from 'effect'
import * as A from 'effect/Array'
import * as O from 'effect/Option'
import type { Config } from 'unique-names-generator'
import { names, uniqueNamesGenerator } from 'unique-names-generator'
import { afterAll, describe, expect } from 'vitest'
import { Email } from '~/runtime/models/Email'
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

export const userManagementTest = T.gen(function* () {
  const userManagement = yield* UserManagement

  const layerUserManagementService = L.succeed(UserManagement)(userManagement)

  const { It } = XTest.withRuntime(
    pipe(FetchHttpClient.layer, L.provideMerge(layerUserManagementService))
  )

  afterAll(() =>
    T.gen(function* () {
      const userManagementService = yield* UserManagement
      yield* userManagementService.deleteTestProjects
      yield* userManagementService.deleteTestUsers
    }).pipe(T.provide(layerUserManagementService), T.runPromise)
  )

  describe('User management', { timeout: 10000 }, () => {
    const createRandomProject = () => ({
      name: uniqueTestNamesGenerator(uniqueNamesCustomConfig)
    })

    const createRandomApplication = (
      projectId: ProjectId
    ): CreateApplication => ({
      name: uniqueTestNamesGenerator(uniqueNamesCustomConfig),
      projectId,
      authMethodTYpe: ['API_AUTH_METHOD_TYPE_PRIVATE_KEY_JWT' as const]
    })

    const createRandomUser = (config: Config): CreateUser => {
      const name = uniqueTestNamesGenerator(config)
      return {
        email: Sc.decodeSync(Email)(`${name}@email.com`),
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
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const userData = createRandomUser(uniqueNamesCustomConfig)

        const user = yield* userManagementService.createUser(userData)

        expect(user).not.equal(undefined)
      })
    )

    It.skip(
      'should not create user if password has not uppercase letter',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const userData = createRandomUser(uniqueNamesCustomConfig)

        const user = yield* userManagementService
          .createUser({
            ...userData,
            password: 'password1'
          })
          .pipe(
            T.catchTag('PasswordNotEnoughStrong', e => T.succeed(e._tag))
          )

        expect(user).equal('PasswordNotEnoughStrong')
      })
    )

    It(
      'should not be possible to create two user with same userName',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const userData = createRandomUser(uniqueNamesCustomConfig)
        yield* userManagementService.createUser(userData)

        const userData2 = {
          ...createRandomUser(uniqueNamesCustomConfig),
          userName: userData.userName
        }

        const userAlreadyExistError = yield* userManagementService
          .createUser(userData2)
          .pipe(T.catchTag('UserAlreadyExist', e => T.succeed(e._tag)))

        expect(userAlreadyExistError).equal('UserAlreadyExist')
      })
    )

    It(
      'should get user by ID',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const userData = createRandomUser(uniqueNamesCustomConfig)
        const { userId } = yield* userManagementService.createUser(userData)
        const UserOutputDTO = yield* userManagementService.getUserById(userId)

        expect(UserOutputDTO).not.equal(undefined)
      })
    )

    It(
      'should get user by loginName',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const userData = createRandomUser(uniqueNamesCustomConfig)
        yield* userManagementService.createUser(userData)
        const UserOutputDTO = yield* userManagementService.getUserByLoginName(
          userData.userName
        )

        expect(UserOutputDTO).not.equal(undefined)
      })
    )

    It(
      'should delete user',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const userData = createRandomUser(uniqueNamesCustomConfig)
        const createUserD = yield* userManagementService.createUser(userData)

        yield* userManagementService.deleteUser(createUserD.userId)
        const getUserErrorResponse = yield* userManagementService
          .getUserById(createUserD.userId)
          .pipe(T.catchTag('UserNotFoundError', e => T.succeed(e._tag)))

        expect(getUserErrorResponse).equals('UserNotFoundError')
      })
    )

    It(
      'should get all projects',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const projectData1 = createRandomProject()
        const projectData2 = createRandomProject()
        const project1Id = yield* userManagementService.createProject(
          projectData1
        )
        const project2Id = yield* userManagementService.createProject(
          projectData2
        )

        const projects = yield* userManagementService.getAllProjects()

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
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const projectData = createRandomProject()
        const project = yield* userManagementService.createProject(projectData)

        expect(project).not.equal(undefined)
      })
    )

    It(
      'should create a application',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const projectData = createRandomProject()
        const projectId = yield* userManagementService.createProject(
          projectData
        )

        const applicationData = createRandomApplication(projectId)
        const applicationId = yield* userManagementService.createApplication(
          applicationData
        )
        expect(applicationId).not.equal(undefined)
      })
    )

    It(
      'should log in with machine user',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const userMachine = createRandomUserMachine()
        const clientId = yield* userManagementService
          .createUserMachine(userMachine)
          .pipe(T.map(r => r.userId))

        const projectData = createRandomProject()
        const projectId = yield* userManagementService.createProject(
          projectData
        )

        const applicationId = yield* userManagementService.createApplication({
          name: uniqueTestNamesGenerator(uniqueNamesCustomConfig),
          projectId,
          authMethodTYpe: ['API_AUTH_METHOD_TYPE_BASIC' as const]
        })
        const clientSecret = yield* userManagementService.createSecretForMachineUser(clientId)

        const accessToken = yield* userManagementService.loginAPIBasic({
          clientId: userMachine.userName,
          projectId: applicationId.toString(),
          clientSecret
        })
        expect(accessToken).not.equal(undefined)
      })
    )

    It(
      'should add roles to a project ',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const projectData = createRandomProject()
        const projectId = yield* userManagementService.createProject(
          projectData
        )
        const roles = [
          { key: 'Admin', name: 'Admin' },
          { key: 'Customer', name: 'Customer' }
        ]
        yield* userManagementService.addProjectRoles(roles, projectId)
        const rolesCreated = yield* userManagementService.getProjectRoles(
          projectId
        )
        expect(roles).not.equal(rolesCreated)
      })
    )

    It(
      'should get current user info',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const userMachine = createRandomUserMachine()
        const userId = yield* userManagementService
          .createUserMachine(userMachine)
          .pipe(T.map(r => r.userId))

        const userPAT = yield* userManagementService.getUserPersonalAccessToken(
          userId
        )

        const userInfo = yield* userManagementService.getCurrentUserInfo(
          userPAT
        )

        expect(userInfo).not.equal(undefined)
      })
    )

    It(
      'should get current user Projects with Roles',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const userMachine = createRandomUserMachine()
        const userId = yield* userManagementService
          .createUserMachine(userMachine)
          .pipe(T.map(r => r.userId))

        const project1Data = createRandomProject()
        const project1Id = yield* userManagementService.createProject(
          project1Data
        )

        const project2Data = createRandomProject()
        const project2Id = yield* userManagementService.createProject(
          project2Data
        )

        const roles = [
          { key: 'Admin', name: 'Admin' },
          { key: 'Customer', name: 'Customer' }
        ]
        yield* userManagementService.addProjectRoles(roles, project1Id)
        yield* userManagementService.addProjectRoles(roles, project2Id)

        yield* userManagementService.addUserRolesToProject(userId, project1Id, [
          'Admin'
        ])
        yield* userManagementService.addUserRolesToProject(userId, project2Id, [
          'Customer'
        ])

        const userPAT = yield* userManagementService.getUserPersonalAccessToken(
          userId
        )
        const userProjectsWithRoles = yield* userManagementService.getCurrentUserProjectsWithRoles(
          userPAT
        )

        expect(userProjectsWithRoles).not.equal(undefined)

        expect(
          pipe(
            userProjectsWithRoles,
            A.findFirst(
              r =>
                r.projectId === project1Id
                && r.roles !== undefined
                && r.roles.includes('Admin')
            ),
            O.isSome
          )
        ).equals(true)
        expect(
          pipe(
            userProjectsWithRoles,
            A.findFirst(
              r =>
                r.projectId === project2Id
                && r.roles !== undefined
                && r.roles.includes('Customer')
            ),
            O.isSome
          )
        ).equals(true)

        expect(userProjectsWithRoles).length(2)
      })
    )

    It(
      'should get user Projects with Roles',
      T.gen(function* () {
        const userManagementService = yield* UserManagement

        const userMachine = createRandomUserMachine()
        const userId = yield* userManagementService
          .createUserMachine(userMachine)
          .pipe(T.map(r => r.userId))

        const project1Data = createRandomProject()
        const project1Id = yield* userManagementService.createProject(
          project1Data
        )

        const project2Data = createRandomProject()
        const project2Id = yield* userManagementService.createProject(
          project2Data
        )

        const roles = [
          { key: 'Admin', name: 'Admin' },
          { key: 'Customer', name: 'Customer' }
        ]
        yield* userManagementService.addProjectRoles(roles, project1Id)
        yield* userManagementService.addProjectRoles(roles, project2Id)

        yield* userManagementService.addUserRolesToProject(userId, project1Id, [
          'Admin'
        ])
        yield* userManagementService.addUserRolesToProject(userId, project2Id, [
          'Customer'
        ])

        const userProjectsWithRoles = yield* userManagementService.getUserProjectsWithRoles(userId)

        expect(userProjectsWithRoles).not.equal(undefined)

        expect(
          pipe(
            userProjectsWithRoles,
            A.findFirst(
              r => r.projectId === project1Id && r.roleKeys.includes('Admin')
            ),
            O.isSome
          )
        ).equals(true)
        expect(
          pipe(
            userProjectsWithRoles,
            A.findFirst(
              r => r.projectId === project2Id && r.roleKeys.includes('Customer')
            ),
            O.isSome
          )
        ).equals(true)

        expect(userProjectsWithRoles).length(2)
      })
    )
  })
})
