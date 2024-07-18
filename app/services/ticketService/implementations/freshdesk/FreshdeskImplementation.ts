import * as Http from '@effect/platform/HttpClient'
import * as Sc from '@effect/schema/Schema'
import { Config, Effect as T, Layer as L, pipe } from 'effect'

import type { OrganizationCreationDTO } from '../../models/organization/OrganizationCreationDTO'
import type { TicketCreationDTO } from '../../models/ticket/TicketCreationDTO'
import { TicketIdSchema } from '../../models/ticket/TicketId'
import type { TicketOutputDTO } from '../../models/ticket/TicketOutputDTO'
import type { TicketServiceService } from '../../TicketService'
import { TicketService } from '../../TicketService'
import type { FreshDeskTicket } from './models/ticket/FreshDeskTicket'
import { FreshDeskTicketOutput } from './models/ticket/FreshDeskTicketOutput'

export const makeFreshdeskImplementation = L.effect(
  TicketService,
  T.gen(function* (_) {
    const TOKEN = yield* _(Config.string('FRESHDESK_ACCESS_TOKEN'), T.catchAll(T.die))

    const defaultClient = yield* _(Http.client.Client)

    const clientWithBaseUrl = defaultClient.pipe(
      Http.client.mapRequest(Http.request.prependUrl('https://rebaze.freshdesk.com/')),
      Http.client.mapRequest(Http.request.basicAuth(TOKEN, `x`)),
      Http.client.mapRequest(Http.request.setHeader('Content-Type', 'application/json')),
      Http.client.catchTags({
        RequestError: T.die,
        ResponseError: T.die
      })
    )

    // -----------------------------------------------------------------------------------------
    // TICKET

    const clientTicket = pipe(
      clientWithBaseUrl,
      Http.client.mapRequest(Http.request.prependUrl('/api/v2/tickets')),
      Http.client.catchTags({
        RequestError: T.die,
        ResponseError: T.die
      })
    )

    const responseTicketOutputDTObuilder = (
      freshDeskTicketOutput: FreshDeskTicketOutput
    ): TicketOutputDTO => ({
      ticketId: Sc.decodeUnknownSync(TicketIdSchema)(freshDeskTicketOutput.id.toString()),
      title: freshDeskTicketOutput.subject,
      messages: [freshDeskTicketOutput.description_text],
      priority: (freshDeskTicketOutput.priority === 4) ? 'urgent' as const : 'normal' as const
    })

    const createTicket: TicketServiceService['createTicket'] = (
      createTicket: TicketCreationDTO
    ) => {
      const freshTicket: FreshDeskTicket = {
        name: createTicket.name,
        email: 'notimplemented',
        subject: createTicket.title,
        description: createTicket.message,
        priority: createTicket.priority === 'urgent' ? 4 : 2,
        type: null,
        status: 2
      }

      return T.gen(function* (_) {
        const body = yield* _(Http.body.json(freshTicket))
        const postRequest = Http.request.post('', {
          acceptJson: true,
          body
        })
        const response = yield* _(clientTicket(postRequest))
        const responseJson = yield* _(response.json)

        const createdTicket = yield* _(
          responseJson,
          Sc.decodeUnknown(FreshDeskTicketOutput),
          T.tapError(() => T.logError(responseJson))
        )

        return responseTicketOutputDTObuilder(createdTicket)
      }).pipe(
        T.catchTags({
          BodyError: T.die,
          ParseError: T.die,
          ResponseError: T.die
        }),
        T.scoped
      )
    }

    const getTicketById: TicketServiceService['getTicketById'] = (ticketId: string) =>
      T.gen(function* (_) {
        const getRequest = Http.request.get(`/${ticketId}`)
        const response = yield* _(clientTicket(getRequest))
        const responseJson = yield* _(response.json)

        const getTicket = yield* _(
          responseJson,
          Sc.decodeUnknown(FreshDeskTicketOutput),
          T.tapError(() => T.logError(responseJson))
        )

        return responseTicketOutputDTObuilder(getTicket)
      }).pipe(
        T.catchTags({
          ParseError: T.die,
          ResponseError: T.die
        }),
        T.scoped
      )

    // -----------------------------------------------------------------------------------------
    // ORGANIZATION

    const createOrganization: TicketServiceService['createOrganization'] = (
      createOrganization: OrganizationCreationDTO
    ) => T.die(createOrganization)

    // -----------------------------------------------------------------------------------------

    return TicketService.of({
      createTicket,
      getTicketById,
      createOrganization,
      createCustomer: () => T.die('Not implemented'),
      getAllOrganizations: T.die('Not implemented'),
      getAllTickets: () => T.die('Not implemented'),
      deleteAllOrganizationsExceptZammadFoundation: T.die('Not implemented'),
      deleteAllTestCustomers: T.die('Not implemented'),
      deleteAllTickets: T.die('Not implemented')
    })
  })
)
