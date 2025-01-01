import { Config, Effect as T, Layer as L, pipe, Schema as Sc } from 'effect'

import { HttpClient, HttpClientRequest } from '@effect/platform'
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
  T.gen(function* () {
    const TOKEN = yield* Config.string('FRESHDESK_ACCESS_TOKEN').pipe(
      T.catchAll(T.die)
    )

    const defaultClient = yield* HttpClient.HttpClient

    const clientWithBaseUrl = defaultClient.pipe(
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl('https://rebaze.freshdesk.com/')
      ),
      HttpClient.mapRequest(HttpClientRequest.basicAuth(TOKEN, `x`)),
      HttpClient.mapRequest(
        HttpClientRequest.setHeader('Content-Type', 'application/json')
      ),
      HttpClient.catchTags({
        RequestError: T.die,
        ResponseError: T.die
      })
    )

    // -----------------------------------------------------------------------------------------
    // TICKET

    const clientTicket = pipe(
      clientWithBaseUrl,
      HttpClient.mapRequest(HttpClientRequest.prependUrl('/api/v2/tickets'))
    )

    const responseTicketOutputDTObuilder = (
      freshDeskTicketOutput: FreshDeskTicketOutput
    ): TicketOutputDTO => ({
      ticketId: Sc.decodeUnknownSync(TicketIdSchema)(
        freshDeskTicketOutput.id.toString()
      ),
      title: freshDeskTicketOutput.subject,
      messages: [freshDeskTicketOutput.description_text],
      priority: freshDeskTicketOutput.priority === 4 ? ('urgent' as const) : ('normal' as const)
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

      return T.gen(function* () {
        const body = HttpClientRequest.bodyJson(freshTicket)
        const postRequest = yield* HttpClientRequest.post('').pipe(
          body
        )
        const response = yield* clientTicket.execute(postRequest)
        const responseJson = yield* response.json

        const createdTicket = yield* pipe(
          responseJson,
          Sc.decodeUnknown(FreshDeskTicketOutput),
          T.tapError(() => T.logError(responseJson))
        )

        return responseTicketOutputDTObuilder(createdTicket)
      }).pipe(
        T.catchTags({
          HttpBodyError: T.die,
          ParseError: T.die,
          ResponseError: T.die
        }),
        T.scoped
      )
    }

    const getTicketById: TicketServiceService['getTicketById'] = (
      ticketId: string
    ) =>
      T.gen(function* () {
        const getRequest = HttpClientRequest.get(`/${ticketId}`)
        const response = yield* clientTicket.execute(getRequest)
        const responseJson = yield* response.json

        const getTicket = yield* pipe(
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
