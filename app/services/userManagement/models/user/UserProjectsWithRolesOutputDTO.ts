export interface UserProjectsWithRolesOutputDTO {
  projectId: string
  projectName: string
  roles?: readonly string[]
  roleKeys: readonly string[]
}
