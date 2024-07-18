import type { ResponseError } from '@effect/platform/Http/ClientError'
import { Effect as T } from 'effect'
import type { Tag } from 'effect/Context'

import { PasswordNotEnoughStrong } from './errors/PasswordNotEnoughStrong'
import type { UserAlreadyExist } from './errors/UserAlreadyExist'
import type { UserNotFoundError } from './errors/UserNotFoundError'
import type { ApplicationId } from './models/application/ApplicationId'
import type { CreateApplication } from './models/application/CreateApplication'
import type { CreateProject } from './models/project/CreateProject'
import type { Project } from './models/project/Project'
import type { ProjectId } from './models/project/ProjectId'
import type { AccessToken } from './models/user/AccessToken'
import type { CreateUser } from './models/user/CreateUser'
import type { CreateUserMachine } from './models/user/CreateUserMachine'
import type { Login } from './models/user/Login'
import type { MachineUser } from './models/user/MachineUserSecret'
import type { Role } from './models/user/Role'
import type { User } from './models/user/User'
import type { UserId } from './models/user/UserId'
import type { UserOutputDTO } from './models/user/UserOutputDTO'
import type { UserProjectsWithRolesOutputDTO } from './models/user/UserProjectsWithRolesOutputDTO'

export class UserManagement extends T.Tag('UserManagement')<UserManagement, {
  createProject(project: CreateProject): T.Effect<ProjectId>
  addProjectRoles(roles: ReadonlyArray<Role>, projectId: ProjectId): T.Effect<void>
  getProjectRoles(projectId: ProjectId): T.Effect<ReadonlyArray<Role>>
  getAllProjects: T.Effect<Project[]>
  createApplication(application: CreateApplication): T.Effect<ApplicationId>
  createUser(user: CreateUser): T.Effect<UserOutputDTO, UserAlreadyExist | PasswordNotEnoughStrong>
  createUserMachine(user: CreateUserMachine): T.Effect<UserOutputDTO, UserAlreadyExist>
  deleteUser(userId: UserId): T.Effect<void>
  addUserRolesToProject(
    userId: UserId,
    projectId: ProjectId,
    roles: readonly ('Admin' | 'Customer')[]
  ): T.Effect<void>
  getUsers: T.Effect<ReadonlyArray<User>>
  getUserById(
    userId: UserId
  ): T.Effect<UserOutputDTO, UserNotFoundError>
  getUserByLoginName(
    loginName: string
  ): T.Effect<UserOutputDTO, UserNotFoundError>
  getUserPersonalAccessToken(userId: string): T.Effect<string>
  getCurrentUserInfo(token: string): T.Effect<UserOutputDTO, UserNotFoundError>
  getCurrentUserProjectsWithRoles(
    token: string
  ): T.Effect<UserProjectsWithRolesOutputDTO[], UserNotFoundError>
  getUserProjectsWithRoles(userId: UserId): T.Effect<UserProjectsWithRolesOutputDTO[]>
  login: T.Effect<{ nonce: string; codeVerifier: string; authorizationUrl: string }>
  loginAPIBasic(
    login: Login
  ): T.Effect<AccessToken, ResponseError>
  createSecretForMachineUser(
    userId: UserId
  ): T.Effect<MachineUser, UserNotFoundError>
  deleteTestProjects: T.Effect<void>
  deleteTestUsers: T.Effect<void>
}>() {}

export type UserManagementService = Tag.Service<typeof UserManagement>
