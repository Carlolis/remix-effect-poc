import { Config, Effect as T, Layer as L, pipe, Schema as Sc } from 'effect'

import { HttpClient, HttpClientRequest } from '@effect/platform'
import { UserAlreadyExist } from '../../../userManagement/errors/UserAlreadyExist'
import type { CustomerCreationDTO } from '../../models/customer/CustomerCreationDTO'
import { CustomerIdSchema } from '../../models/customer/CustomerId'
import type { CustomerOutputDTO } from '../../models/customer/CustomerOutputDTO'
import type { OrganizationCreationDTO } from '../../models/organization/OrganizationCreationDTO'
import { OrganizationIdSchema } from '../../models/organization/OrganizationId'
import type { OrganizationOutputDTO } from '../../models/organization/OrganizationOutputDTO'
import type { TicketCreationDTO } from '../../models/ticket/TicketCreationDTO'
import { TicketIdSchema } from '../../models/ticket/TicketId'
import type { TicketOutputDTO } from '../../models/ticket/TicketOutputDTO'
import type { TicketServiceService } from '../../TicketService'
import { TicketService } from '../../TicketService'
import type { ZammadCustomerCreationDTO } from './models/customer/ZammadCustomerCreationDTO'
import { ZammadCustomerResponse } from './models/customer/ZammadCustomerResponse'
import { ZammadError } from './models/errors/ZammadError'
import type { ZammadOrganizationCreationDTO } from './models/organization/ZammadOrganizationCreationDTO'
import { ZammadOrganizationResponse } from './models/organization/ZammadOrganizationResponse'
import { ZammadArticle } from './models/ticket/ZammadArticle'
import type { ZammadTicketCreationDTO } from './models/ticket/ZammadTicketCreationDTO'
import { ZammadTicketResponse } from './models/ticket/ZammadTicketResponse'

export const makeZammadImplementation = L.effect(
  TicketService,
  T.gen(function* () {
    const TOKEN = yield* Config.string('ZAMMAD_ACCESS_TOKEN').pipe(
      T.catchAll(T.die)
    )

    const defaultClient = yield* HttpClient.HttpClient

    const clientWithBaseUrl = defaultClient.pipe(
      HttpClient.mapRequest(
        HttpClientRequest.prependUrl('http://localhost:8080/api/v1')
      ),
      HttpClient.mapRequest(HttpClientRequest.bearerToken(TOKEN)),
      HttpClient.tapRequest(req => T.logInfo('Request zammad', req)),
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

    const responseTicketWithArticlesOutputDTObuilder = (
      zammadTicketResponse: ZammadTicketResponse,
      zammadArticles: readonly ZammadArticle[]
    ): TicketOutputDTO => ({
      ticketId: Sc.decodeSync(TicketIdSchema)(
        zammadTicketResponse.id.toString()
      ),
      title: zammadTicketResponse.title,
      messages: zammadArticles.map(a => a.body),
      priority: 'normal' as const
    })

    const createTicket: TicketServiceService['createTicket'] = (
      createTicketData: TicketCreationDTO,
      userEmail: string
    ) =>
      T.gen(function* () {
        const generateBody = createTicketData.message + '\nmapLink: ' + createTicketData.mapLink
        const zammadTicket: ZammadTicketCreationDTO = {
          title: createTicketData.title,
          customer: userEmail,
          group: 'Users',
          article: {
            subject: '',
            body: generateBody,
            type: '',
            internal: false
          }
        }

        const clientXOnBehalfOfWithBaseUrl = clientWithBaseUrl.pipe(
          HttpClient.mapRequest(
            HttpClientRequest.setHeader('X-On-Behalf-Of', `${userEmail}`)
          )
        )

        const body = HttpClientRequest.bodyJson(zammadTicket)
        const postRequest = yield* HttpClientRequest.post('/tickets').pipe(
          body
        )
        const response = yield* clientXOnBehalfOfWithBaseUrl.execute(postRequest)
        const responseJson = yield* response.json

        const createdTicket = yield* pipe(
          responseJson,
          Sc.decodeUnknown(ZammadTicketResponse),
          T.tapError(() => T.logError(responseJson))
        )

        return responseTicketWithArticlesOutputDTObuilder(createdTicket, [
          zammadTicket.article
        ])
      }).pipe(
        T.catchTags({
          HttpBodyError: T.die,
          ParseError: T.die,
          ResponseError: T.die
        }),
        T.scoped
      )

    const getTicketById: TicketServiceService['getTicketById'] = (
      ticketId: string
    ) =>
      T.gen(function* () {
        yield* T.logInfo('TicketService - getTicketById', ticketId)
        const getRequest = HttpClientRequest.get(`/tickets/${ticketId}`)
        const response = yield* clientWithBaseUrl.execute(getRequest)
        const responseJson = yield* response.json

        const getTicket = yield* pipe(
          responseJson,
          Sc.decodeUnknown(ZammadTicketResponse),
          T.tapError(() => T.logError('TicketService - getTicketById', responseJson))
        )

        const getArticlesRequest = HttpClientRequest.get(
          `/ticket_articles/by_ticket/${ticketId}`
        )
        const responseArticles = yield* clientWithBaseUrl.execute(getArticlesRequest)
        const responseArticlesJson = yield* responseArticles.json
        yield* T.logInfo('TicketService - getTicketById', responseArticlesJson)
        const getArticles = yield* pipe(
          responseArticlesJson,
          Sc.decodeUnknown(Sc.Array(ZammadArticle)),
          T.tapError(() => T.logError(responseArticlesJson))
        )

        return responseTicketWithArticlesOutputDTObuilder(
          getTicket,
          getArticles
        )
      }).pipe(
        T.catchTags({
          ParseError: T.die,
          ResponseError: T.die
        }),
        T.scoped
      )

    const getAllTickets: TicketServiceService['getAllTickets'] = (
      customerEmail: string
    ) =>
      T.gen(function* () {
        const clientXOnBehalfOfWithBaseUrl = clientWithBaseUrl.pipe(
          HttpClient.mapRequest(
            HttpClientRequest.setHeader('X-On-Behalf-Of', `${customerEmail}`)
          )
        )

        const getRequest = HttpClientRequest.get(`/tickets`)
        const response = yield* clientXOnBehalfOfWithBaseUrl.execute(getRequest)
        const responseJson = yield* response.json

        const allTickets = yield* pipe(
          responseJson,
          Sc.decodeUnknown(Sc.Array(ZammadTicketResponse)),
          T.tapError(() => T.logError(responseJson))
        )

        return yield* pipe(
          allTickets,
          T.forEach(ticket =>
            T.gen(function* () {
              const getArticlesRequest = HttpClientRequest.get(
                `/ticket_articles/by_ticket/${ticket.id}`
              )
              const responseArticles = yield* clientXOnBehalfOfWithBaseUrl.execute(
                getArticlesRequest
              )
              const responseArticlesJson = yield* responseArticles.json
              const articles = yield* pipe(
                responseArticlesJson,
                Sc.decodeUnknown(Sc.Array(ZammadArticle)),
                T.tapError(() => T.logError(responseArticlesJson))
              )
              return responseTicketWithArticlesOutputDTObuilder(
                ticket,
                articles
              )
            })
          )
        )
      }).pipe(
        T.catchTags({
          ParseError: T.die,
          ResponseError: T.die
        }),
        T.scoped
      )

    const deleteAllTickets: TicketServiceService['deleteAllTickets'] = T.gen(
      function* () {
        const getRequest = HttpClientRequest.get(`/tickets`)
        const responseJson = yield* pipe(
          clientWithBaseUrl.execute(getRequest),
          T.flatMap(response => response.json)
        )
        yield* pipe(
          responseJson,
          Sc.decodeUnknown(Sc.Array(ZammadTicketResponse)),
          T.tapError(() => T.logError(responseJson)),
          T.flatMap(tickets =>
            pipe(
              tickets,
              T.forEach(ticket => {
                const requestDelete = HttpClientRequest.del(`/tickets/${ticket.id}`)
                return clientWithBaseUrl.execute(requestDelete)
              })
            )
          )
        )
      }
    ).pipe(
      T.catchTags({
        ParseError: T.die,
        ResponseError: T.die
      }),
      T.scoped
    )

    // -----------------------------------------------------------------------------------------
    // ORGANIZATION

    const responseOrganizationOutputDTObuilder = (
      zammadOrganizationOutput: ZammadOrganizationResponse
    ): OrganizationOutputDTO => ({
      id: Sc.decodeUnknownSync(OrganizationIdSchema)(
        zammadOrganizationOutput.id.toString()
      ),
      name: zammadOrganizationOutput.name
    })

    const createOrganization: TicketServiceService['createOrganization'] = (
      createOrganizationData: OrganizationCreationDTO
    ) =>
      T.gen(function* () {
        const zammadOrganization: ZammadOrganizationCreationDTO = {
          name: createOrganizationData.organisationName,
          shared: false,
          domain: '',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          domain_assignment: false,
          active: false,
          vip: false,
          note: createOrganizationData.description,
          members: createOrganizationData.members
        }

        const body = HttpClientRequest.bodyJson(zammadOrganization)
        const postRequest = yield* HttpClientRequest.post('/organizations').pipe(
          body
        )
        const response = yield* clientWithBaseUrl.execute(postRequest)
        const responseJson = yield* response.json

        const createdOrganization = yield* pipe(
          responseJson,
          Sc.decodeUnknown(ZammadOrganizationResponse),
          T.tapError(() => T.logError(responseJson))
        )

        return responseOrganizationOutputDTObuilder(createdOrganization)
      }).pipe(
        T.catchTags({
          HttpBodyError: T.die,
          ParseError: T.die,
          ResponseError: T.die
        }),
        T.scoped
      )

    const getAllOrganizations: TicketServiceService['getAllOrganizations'] = T.gen(function* () {
      const getRequest = HttpClientRequest.get('/organizations')
      const response = yield* clientWithBaseUrl.execute(getRequest)
      const responseJson = yield* response.json
      const allOrganizations = yield* pipe(
        responseJson,
        Sc.decodeUnknown(Sc.Array(ZammadOrganizationResponse)),
        T.tapError(() => T.logError(responseJson))
      )
      return allOrganizations.map(responseOrganizationOutputDTObuilder)
    }).pipe(
      T.catchTags({
        ParseError: e =>
          T.gen(function* () {
            yield* T.logError(e.message)
            return yield* T.die(e)
          }),
        ResponseError: T.die
      }),
      T.scoped
    )

    const deleteAllOrganizationsExceptZammadFoundation:
      TicketServiceService['deleteAllOrganizationsExceptZammadFoundation'] = T.gen(function* () {
        yield* pipe(
          getAllOrganizations,
          T.flatMap(organizations =>
            pipe(
              organizations,
              T.forEach(organization => {
                if (organization.name !== 'Zammad Foundation') {
                  return clientWithBaseUrl.execute(
                    HttpClientRequest.del(`/organizations/${organization.id}`)
                  )
                } else {
                  return T.void
                }
              })
            )
          ),
          T.scoped
        )
      })

    // -----------------------------------------------------------------------------------------
    // Customer

    const responseCustomerOutputDTObuilder = (
      zammadCustomerResponse: ZammadCustomerResponse
    ): CustomerOutputDTO => ({
      customerId: Sc.decodeSync(CustomerIdSchema)(
        zammadCustomerResponse.id.toString()
      ),
      organisationId: zammadCustomerResponse.organization_id
    })

    const createCustomer: TicketServiceService['createCustomer'] = (
      createCustomer: CustomerCreationDTO
    ) =>
      T.gen(function* () {
        const zammadCustomer: ZammadCustomerCreationDTO = {
          firstName: createCustomer.firstName,
          lastName: createCustomer.lastName,
          login: createCustomer.userName,
          email: createCustomer.email,
          organization: createCustomer.organization,
          roles: createCustomer.roles
        }

        const body = HttpClientRequest.bodyJson(zammadCustomer)
        const postRequest = yield* HttpClientRequest.post('/users').pipe(
          body
        )
        const response = yield* clientWithBaseUrl.execute(postRequest)
        const responseJson = yield* response.json

        const createdCustomer = yield* pipe(
          responseJson,
          Sc.decodeUnknown(ZammadCustomerResponse),
          T.catchAll(() =>
            pipe(
              Sc.decodeUnknown(ZammadError)(responseJson),
              T.tap(T.logError),
              T.flatMap(userNotFound => {
                const result: T.Effect<never, UserAlreadyExist> = userNotFound.error
                    === `Email address '${createCustomer.email.toLocaleLowerCase()}' is already used for another user.` ?
                  T.fail(UserAlreadyExist.of(userNotFound.error_human)) :
                  T.die(userNotFound)
                return result
              })
            )
          ),
          T.tapError(error => T.logError(error))
        )

        return responseCustomerOutputDTObuilder(createdCustomer)
      }).pipe(
        T.catchTags({
          HttpBodyError: T.die,
          ParseError: T.die,
          ResponseError: T.die
        }),
        T.scoped
      )

    const deleteAllTestCustomers: TicketServiceService['deleteAllTestCustomers'] = T.gen(
      function* () {
        const getRequest = HttpClientRequest.get(`/users`)
        const responseJson = yield* pipe(
          clientWithBaseUrl.execute(getRequest),
          T.flatMap(response => response.json)
        )
        yield* pipe(
          responseJson,
          Sc.decodeUnknown(Sc.Array(ZammadCustomerResponse)),
          T.tapError(() => T.logError(responseJson)),
          T.flatMap(customers =>
            pipe(
              customers,
              T.forEach(customer => {
                if (customer.login.match('test_')) {
                  const postRequest = HttpClientRequest.post(
                    `/data_privacy_tasks`
                  ).pipe(
                    HttpClientRequest.bodyJson({
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      deletable_id: customer.id,
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      deletable_type: 'User',
                      preferences: {
                        sure: 'EFFACER'
                      }
                    } // id: "c-16"
                    )
                  )
                  return pipe(postRequest, T.flatMap(post => clientWithBaseUrl.execute(post)))
                } else {
                  return T.void
                }
              })
            )
          )
        )
      }
    ).pipe(
      T.catchTags({
        HttpBodyError: T.die,
        ParseError: T.die,
        ResponseError: T.die
      }),
      T.scoped
    )

    // -----------------------------------------------------------------------------------------

    return TicketService.of({
      createTicket,
      getTicketById,
      getAllTickets,
      deleteAllTickets,
      createOrganization,
      getAllOrganizations,
      deleteAllOrganizationsExceptZammadFoundation,
      createCustomer,
      deleteAllTestCustomers
    })
  })
)
