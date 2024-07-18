import { Effect as T } from 'effect'
import type { Tag } from 'effect/Context'

import type { UserAlreadyExist } from '../userManagement/errors/UserAlreadyExist'
import type { CustomerCreationDTO } from './models/customer/CustomerCreationDTO'
import type { CustomerOutputDTO } from './models/customer/CustomerOutputDTO'
import type { OrganizationCreationDTO } from './models/organization/OrganizationCreationDTO'
import type { OrganizationOutputDTO } from './models/organization/OrganizationOutputDTO'
import type { TicketCreationDTO } from './models/ticket/TicketCreationDTO'
import type { TicketId } from './models/ticket/TicketId'
import type { TicketOutputDTO } from './models/ticket/TicketOutputDTO'

export class TicketService extends T.Tag('TicketService')<TicketService, {
  createTicket(
    creationTicketInputDto: TicketCreationDTO,
    userEmail: string
  ): T.Effect<TicketOutputDTO>
  getTicketById(ticketId: TicketId): T.Effect<TicketOutputDTO>
  getAllTickets(customerEmail: string): T.Effect<TicketOutputDTO[]>
  deleteAllTickets: T.Effect<void>
  createOrganization(
    creationOrganizationInputDto: OrganizationCreationDTO
  ): T.Effect<OrganizationOutputDTO>
  getAllOrganizations: T.Effect<OrganizationOutputDTO[]>
  deleteAllOrganizationsExceptZammadFoundation: T.Effect<void>
  createCustomer(
    createCustomer: CustomerCreationDTO
  ): T.Effect<CustomerOutputDTO, UserAlreadyExist>
  deleteAllTestCustomers: T.Effect<void>
}>() {}

export type TicketServiceService = Tag.Service<typeof TicketService>
