import * as Sc from '@effect/schema/Schema'
import { useLoaderData, useSubmit } from '@remix-run/react'
import { pipe } from 'effect'
import * as O from 'effect/Option'
import { useState } from 'react'

import { effectTsResolver } from '@hookform/resolvers/effect-ts'
import { Checkbox } from '@radix-ui/react-checkbox'
import { useForm } from 'react-hook-form'
import { Button } from '~/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel,
  FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { CreateUser } from '~/services/userManagement/models/user/CreateUser'
import { ButtonGoBackHome } from '../components/buttonGoBackHome'
import type { Project } from '../services/userManagement/models/project/Project'
import type { ProjectId } from '../services/userManagement/models/project/ProjectId'
import { ProjectIdSchema } from '../services/userManagement/models/project/ProjectId'
export { action, loader } from '../.server/signup.server'

const RolesSchema = Sc.transform(
  Sc.String,
  Sc.Array(Sc.Literal('Admin', 'Customer')),
  {
    decode: a => a.split(',').map(a => a.trim()) as readonly ('Admin' | 'Customer')[],
    encode: a => a.toString()
  }
)

export const CreateUserForm = Sc.extend(CreateUser)(
  Sc.Struct({ roles: RolesSchema, projectId: ProjectIdSchema })
)

export type CreateUserForm = Sc.Schema.Type<typeof CreateUserForm>

export default function Signup() {
  const form = useForm<CreateUserForm>({
    resolver: effectTsResolver(CreateUserForm)
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [roles, setRoles] = useState(['Customer'])

  const projects = pipe(useLoaderData<Project[]>(), O.fromNullable, O.getOrElse(() => []))
  const [projectId, setProjectId] = useState<ProjectId | undefined>(projects[0]?.id)

  const submit = useSubmit()

  function onSubmit(values: CreateUserForm) {
    console.log(values)
    submit(values, { method: 'POST' })
  }

  return (
    <div className="font-sans leading-5 mt-10 flex flex-col items-center justify-center">
      <ButtonGoBackHome />
      <div className="text-2xl font-bold mb-4 mt-2">- SIGN-UP -</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email" {...field} />
                </FormControl>
                <FormDescription>
                  Please enter your email
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="userName" {...field} />
                </FormControl>
                <FormDescription>
                  Please enter your userName
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="password" {...field} />
                </FormControl>
                <FormDescription>
                  Please enter your password
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </form>
      </Form>
    </div>
  )
}
