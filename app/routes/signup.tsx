import * as Sc from '@effect/schema/Schema'
import { Form, useLoaderData } from '@remix-run/react'
import { pipe } from 'effect'
import * as O from 'effect/Option'
import { useState } from 'react'

import { Checkbox } from '@radix-ui/react-checkbox'
import { Button } from '~/components/ui/button'
import { ButtonGoBackHome } from '../components/buttonGoBackHome'
import type { Project } from '../services/userManagement/models/project/Project'
import type { ProjectId } from '../services/userManagement/models/project/ProjectId'
import { ProjectIdSchema } from '../services/userManagement/models/project/ProjectId'

export { action, loader } from '../.server/signup.server'
// names we are going to use in the strategy
export default function Signup() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [roles, setRoles] = useState(['Customer'])

  const projects = pipe(useLoaderData<Project[]>(), O.fromNullable, O.getOrElse(() => []))
  const [projectId, setProjectId] = useState<ProjectId | undefined>(projects[0]?.id)

  return (
    <div>
      <ButtonGoBackHome>- SIGN-UP -</ButtonGoBackHome>
      <Form method="post">
        <div>
          <div>
            <label htmlFor="email">Email</label>
            <input type="email" placeholder="email" name="email" />
          </div>
          <div>
            <label htmlFor="userName">Username</label>
            <input type="text" placeholder="userName" name="userName" />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input type="password" placeholder="password" name="password" />
          </div>
          <div>
            <label htmlFor="firstName">First name</label>
            <input type="text" placeholder="First Name" name="firstName" />
          </div>
          <div>
            <label htmlFor="lastName">Last name</label>
            <input type="text" placeholder="Last Name" name="lastName" />
          </div>
          <div>
            <label htmlFor="lastName">Projects</label>
            <input type="hidden" name="projectId" value={projectId} />
            <select
              value={projectId}
              onChange={e => setProjectId(Sc.decodeUnknownSync(ProjectIdSchema)(e.target.value))}
            >
              {projects.map(project => (
                <option value={project.id} key={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lastName">Role</label>
            <input type="hidden" name="roles" value={roles} />

            <div>
              <Checkbox value="Admin">Admin</Checkbox>
              <Checkbox value="Customer">Customer</Checkbox>
            </div>
          </div>
          <div>
            <Button type="submit">Sign up with Zitadel</Button>
          </div>
        </div>
      </Form>
    </div>
  )
}
