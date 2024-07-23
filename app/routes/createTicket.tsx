import * as Sc from '@effect/schema/Schema'
import { effectTsResolver } from '@hookform/resolvers/effect-ts'
import { useLoaderData, useSubmit } from '@remix-run/react'
import { useForm } from 'react-hook-form'
import { Button } from '~/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel,
  FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger,
  SelectValue } from '~/components/ui/select'
import { TicketPrioritySchema } from '~/services/ticketService/models/commons'
import { ButtonGoBackHome } from '../components/buttonGoBackHome'

import { loader } from '../.server/createTicket.server'

export { action, loader } from '../.server/createTicket.server'

export const TicketCreationForm = Sc.Struct({
  name: Sc.String,
  title: Sc.String,
  message: Sc.String,
  priority: TicketPrioritySchema.pipe(
    Sc.propertySignature,
    Sc.withConstructorDefault(() => 'normal' as const)
  )
  // organization: Sc.optional(Sc.String),
  // // eslint-disable-next-line @typescript-eslint/naming-convention
  // organization_id: Sc.optional(Sc.String),
  // mapLink: Sc.optional(Sc.String)
})
type TicketCreationForm = Sc.Schema.Type<typeof TicketCreationForm>

export default function CreateTicketForm() {
  const userInfo = useLoaderData<typeof loader>()
  const form = useForm<TicketCreationForm>({
    resolver: effectTsResolver(TicketCreationForm),
    defaultValues: {
      message: ''
    }
  })

  const submit = useSubmit()

  function onSubmit(values: TicketCreationForm) {
    console.log(values)
    submit(values, { method: 'POST' })
  }
  return (
    <div className="font-sans leading-5 mt-10 flex flex-col items-center justify-center">
      <ButtonGoBackHome />
      <div className="text-2xl font-bold mb-4 mt-2">- CREATE A TICKET -</div>
      <div className="mb-4">Hello {userInfo.preferred_username}, you can create a ticket</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="name" {...field} />
                </FormControl>
                <FormDescription>
                  Please add a ticket name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="title" {...field} />
                </FormControl>
                <FormDescription>
                  Please add a ticket title
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Input placeholder="message" {...field} />
                </FormControl>
                <FormDescription>
                  Please add a ticket message
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Please choose a priority
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Send ticket</Button>
        </form>
      </Form>
    </div>
  )
}
