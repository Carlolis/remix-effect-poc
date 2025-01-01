import { Effect as T, pipe } from 'effect'

import { FetchHttpClient } from '@effect/platform'
import { ticketServiceTest } from '../../TicketService_spec'
import { makeZammadImplementation } from './ZammadImplementation'

pipe(
  ticketServiceTest({
    multiTenant_twoUsersWithSameEmailInDifferentOrganizationsAllowed: false
  }),
  T.provide(
    makeZammadImplementation
  ),
  T.provide(FetchHttpClient.layer),
  T.runSync
)
