import type { ProjectId } from '../project/ProjectId'

export interface CreateApplication {
  name: string
  projectId: ProjectId
  authMethodTYpe: ('API_AUTH_METHOD_TYPE_PRIVATE_KEY_JWT' | 'API_AUTH_METHOD_TYPE_BASIC')[]
}
