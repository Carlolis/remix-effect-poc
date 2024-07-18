import * as Sc from '@effect/schema/Schema'

/**
 * @param name customer's name
 * @param customer customer's email
 * @param subject ticket's title
 * @param description ticket's message
 * @param status ticket's status
 * @param priority ticket's priority
 * @param type ticket's type
 * @param requester_id requester's ID
 */
export const ZammadTicketCreationDTO = Sc.Struct({
  title: Sc.String,
  group: Sc.String,
  customer: Sc.String,
  article: Sc.Struct(
    {
      subject: Sc.String,
      body: Sc.String,
      type: Sc.String,
      internal: Sc.Boolean
    }
  )
})

export type ZammadTicketCreationDTO = Sc.Schema.Type<typeof ZammadTicketCreationDTO>
