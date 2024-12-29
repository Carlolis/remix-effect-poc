import * as Sc from '@effect/schema/Schema'
import { useLoaderData, useSubmit } from 'react-router';
import { pipe } from 'effect'
import * as O from 'effect/Option'

import { stringify } from '@effect/schema/FastCheck'
import { effectTsResolver } from '@hookform/resolvers/effect-ts'
import { useForm } from 'react-hook-form'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { CreateUser } from '~/services/userManagement/models/user/CreateUser'
import { ButtonGoBackHome } from '../components/buttonGoBackHome'
import type { Project } from '../services/userManagement/models/project/Project'
import { ProjectIdSchema } from '../services/userManagement/models/project/ProjectId'
import { Route } from './+types/signup';
export { action, loader } from '../.server/signup.server'

export const CreateUserForm = Sc.extend(CreateUser)(
  Sc.Struct({ roles: Sc.Array(Sc.Literal('Admin', 'Customer')), projectId: ProjectIdSchema })
)

export type CreateUserForm = Sc.Schema.Type<typeof CreateUserForm>

export default function Signup({ loaderData }: Route.ComponentProps) {
  const form = useForm<CreateUserForm>({
    resolver: effectTsResolver(CreateUserForm)
  })
  console.log("loaderData", loaderData)

  const projects = pipe(useLoaderData<Project[]>(), O.fromNullable, O.getOrElse(() => []))

  const submit = useSubmit()

  function onSubmit(values: CreateUserForm) {
    console.log(values)
    submit(values, { method: 'POST', encType: 'application/json' })
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
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First Name" {...field} />
                </FormControl>
                <FormDescription>
                  Please enter your first name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} />
                </FormControl>
                <FormDescription>
                  Please enter your last name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <p role="alert">{form.formState.errors.firstName?.message}</p>
          <p role="alert">{form.formState.errors.email?.message}</p>
          <p role="alert">{stringify(form.formState.errors)}</p>
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Name</FormLabel>
                <FormControl>
                  <Input placeholder="userName" {...field} />
                </FormControl>
                <FormDescription>
                  Please enter your user name
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

          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem value={project.id} key={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roles"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Roles</FormLabel>
                </div>
                {['Customer', 'Admin'].map(role => (
                  <FormField
                    key={role}
                    control={form.control}
                    name="roles"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={role}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(role as 'Admin' | 'Customer')}
                              onCheckedChange={checked => {
                                return checked ?
                                  field.onChange(
                                    field.value !== undefined ? [...field.value, role] : [role]
                                  ) :
                                  field.onChange(
                                    field.value?.filter(
                                      value => value !== role
                                    )
                                  )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {role}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <Button type="submit">Sign up with Zitadel</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
