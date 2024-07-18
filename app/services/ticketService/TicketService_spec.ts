import { XTest } from '@rebaze-fr/util-test-helpers-next'
import { Effect as T, Layer as L, pipe } from 'effect'
import type { Config } from 'unique-names-generator'
import { adjectives, names, uniqueNamesGenerator } from 'unique-names-generator'
import { afterAll, describe, expect } from 'vitest'

import type { CustomerCreationDTO } from './models/customer/CustomerCreationDTO'
import type { OrganizationCreationDTO } from './models/organization/OrganizationCreationDTO'
import { TicketService } from './TicketService'

interface TicketServiceOptions {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  multiTenant_twoUsersWithSameEmailInDifferentOrganizationsAllowed: boolean
}

// todo : make test about priority et status ouvert
export const ticketServiceTest = (
  // eslint-disable-next-line @typescript-eslint/naming-convention
  { multiTenant_twoUsersWithSameEmailInDifferentOrganizationsAllowed }: TicketServiceOptions
) =>
  T.gen(function* (_) {
    afterAll(() =>
      T.gen(function* (_) {
        const ticketService = yield* _(TicketService)
        yield* _(ticketService.deleteAllTickets)
        yield* _(ticketService.deleteAllTestCustomers)
        yield* _(ticketService.deleteAllOrganizationsExceptZammadFoundation)
      }).pipe(T.provide(layerTicketService), T.runPromise), 100000)

    const ticketService = yield* _(TicketService)

    const layerTicketService = L.succeed(TicketService)(ticketService)

    const { It } = XTest.withRuntime(pipe(layerTicketService))

    describe('Ticket Management', { timeout: 10000 }, () => {
      // -----------------------------------------------------------------------------------------
      // ORGANIZATION

      const createRandomOrganization = (): OrganizationCreationDTO => {
        const uniqueNamesCustomConfig = {
          dictionaries: [names, adjectives],
          separator: '_',
          length: 2
        }
        const generateName = uniqueNamesGenerator(uniqueNamesCustomConfig).replace(' ', '-')
        return {
          organisationName: 'test_' + generateName + '_&_Cie',
          description: '',
          members: []
        }
      }

      It(
        'should create organization',
        T.gen(function* (_) {
          const ticketServiceImplementation = yield* _(TicketService)

          const organisationData = createRandomOrganization()
          const organizationCreated = yield* _(
            ticketServiceImplementation.createOrganization(organisationData)
          )

          expect(organizationCreated).not.equal(undefined)
          expect(organizationCreated.name).equal(organisationData.organisationName)
        })
      )

      // -----------------------------------------------------------------------------------------
      // CUSTOMER

      const createRandomCustomer = (
        organizationName?: string,
        roles?: readonly ('Admin' | 'Customer')[]
      ): CustomerCreationDTO => {
        const uniqueNamesCustomConfig: Config = {
          dictionaries: [names, names, adjectives],
          separator: '_',
          length: 3
        }
        const generateName: string = uniqueNamesGenerator(uniqueNamesCustomConfig).replace(' ', '-')
        return {
          userName: 'test_' + generateName,
          firstName: generateName.split('_')[0] + '',
          lastName: generateName.split('_')[1] + '',
          email: ('test_' + generateName + '@mail.com').toLowerCase(),
          organization: organizationName,
          roles: roles ? roles : []
        }
      }

      It(
        'should create customer',
        T.gen(function* (_) {
          const ticketService = yield* _(TicketService)

          const customerData = createRandomCustomer(undefined, ['Customer'])
          const customerCreated = yield* _(ticketService.createCustomer(customerData))

          expect(customerCreated).not.equal(undefined)
        })
      )

      It(
        'should not be possible to create two customers with the same email with same organization',
        T.gen(function* (_) {
          const ticketService = yield* _(TicketService)

          const customerData = createRandomCustomer()
          const customerData2 = createRandomCustomer()

          const organisationData = createRandomOrganization()
          const organizationCreated = yield* _(
            ticketService.createOrganization(organisationData)
          )

          yield* _(
            ticketService.createCustomer({
              ...customerData,
              organization: organizationCreated.name
            })
          )

          const error = yield* _(
            ticketService.createCustomer({
              ...customerData2,
              email: customerData.email,
              organization: organizationCreated.name
            }),
            T.catchTag('UserAlreadyExist', e => T.succeed(e._tag))
          )

          expect(error).equal('UserAlreadyExist')
        })
      )
      if (multiTenant_twoUsersWithSameEmailInDifferentOrganizationsAllowed) {
        It(
          'should create two customers with the same email with different organization',
          T.gen(function* (_) {
            const ticketService = yield* _(TicketService)

            const customerData = createRandomCustomer()
            const customerData2 = createRandomCustomer()

            const organisationData = createRandomOrganization()
            const organizationCreated = yield* _(
              ticketService.createOrganization(organisationData)
            )

            const customerCreated = yield* _(
              ticketService.createCustomer({
                ...customerData,
                organization: organizationCreated.name
              })
            )

            const organisationData2 = createRandomOrganization()
            const organizationCreated2 = yield* _(
              ticketService.createOrganization(organisationData2)
            )
            const customerCreated2 = yield* _(
              ticketService.createCustomer({
                ...customerData2,
                email: customerData.email,
                organization: organizationCreated2.name
              })
            )

            expect(customerCreated).not.equal(undefined)
            expect(customerCreated2).not.equal(undefined)
          })
        )
      }

      // -----------------------------------------------------------------------------------------
      // TICKET

      const createRandomTicket = (customerName: string) => ({
        name: customerName,
        priority: 'urgent' as const,
        message: 'mon message',
        title: 'mon titre',
        mapLink: 'url'
      })

      It(
        'should create ticket',
        T.gen(function* (_) {
          const ticketService = yield* _(TicketService)

          const customer = createRandomCustomer()
          yield* _(
            ticketService.createCustomer(customer)
          )

          const ticketCreated = yield* _(
            ticketService.createTicket(createRandomTicket(customer.userName), customer.email)
          )

          expect(ticketCreated.ticketId).not.equal(undefined)
        })
      )

      It(
        'should get ticket by ID',
        T.gen(function* (_) {
          const ticketServiceImplementation = yield* _(TicketService)

          const customer = createRandomCustomer()
          yield* _(
            ticketService.createCustomer(customer)
          )

          const createdTicket = yield* _(
            ticketServiceImplementation.createTicket(
              createRandomTicket(customer.userName),
              customer.email
            )
          )

          const getTicket = yield* _(
            ticketServiceImplementation.getTicketById(createdTicket.ticketId)
          )

          expect(getTicket).not.equal(undefined)
          expect(getTicket.ticketId).equal(createdTicket.ticketId)
          expect(getTicket.title).equal(createdTicket.title)
          expect(getTicket.messages[0]).equals(createdTicket.messages[0])
          expect(getTicket.priority).equal(createdTicket.priority)
        })
      )

      It(
        `should get all tickets from an user's email`,
        T.gen(function* (_) {
          const ticketServiceImplementation = yield* _(TicketService)

          const customer = createRandomCustomer()
          yield* _(
            ticketServiceImplementation.createCustomer(customer)
          )

          const createdTicket = yield* _(
            ticketServiceImplementation.createTicket(
              createRandomTicket(customer.userName),
              customer.email
            )
          )
          const getAllTickets = yield* _(
            ticketServiceImplementation.getAllTickets(customer.email)
          )

          expect(getAllTickets).not.equal(undefined)
          expect(getAllTickets).length(1)
          expect(getAllTickets[0]?.ticketId).is.equal(createdTicket.ticketId)
          expect(getAllTickets[0]?.title).is.equal(createdTicket.title)
          expect(getAllTickets[0]?.messages[0]).equals(createdTicket.messages[0])
          expect(getAllTickets[0]?.priority).is.equal(createdTicket.priority)
        })
      )

      It(
        `should get all tickets from an user's email with two user and tickets`,
        T.gen(function* (_) {
          const ticketServiceImplementation = yield* _(TicketService)

          const customer1 = createRandomCustomer()
          yield* _(
            ticketServiceImplementation.createCustomer(customer1)
          )
          const createdTicket = yield* _(
            ticketServiceImplementation.createTicket(
              createRandomTicket(customer1.userName),
              customer1.email
            )
          )

          const customer2 = createRandomCustomer()
          yield* _(
            ticketServiceImplementation.createCustomer(customer2)
          )
          yield* _(
            ticketServiceImplementation.createTicket(
              createRandomTicket(customer2.userName),
              customer2.email
            )
          )

          const getAllTickets = yield* _(
            ticketServiceImplementation.getAllTickets(customer1.email)
          )

          expect(getAllTickets).not.equal(undefined)
          expect(getAllTickets).length(1)
          expect(getAllTickets[0]?.ticketId).is.equal(createdTicket.ticketId)
          expect(getAllTickets[0]?.title).is.equal(createdTicket.title)
          expect(getAllTickets[0]?.messages[0]).equals(createdTicket.messages[0])
          expect(getAllTickets[0]?.priority).is.equal(createdTicket.priority)
        })
      )

      // -----------------------------------------------------------------------------------------
    })
  })
