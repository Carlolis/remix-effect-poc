import * as Http from '@effect/platform/HttpClient'
import { Effect as T, pipe } from 'effect'

import { ticketServiceTest } from '../../TicketService_spec'
import { makeZammadImplementation } from './ZammadImplementation'

pipe(
  ticketServiceTest({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    multiTenant_twoUsersWithSameEmailInDifferentOrganizationsAllowed: false
  }),
  T.provide(
    makeZammadImplementation
  ),
  T.provide(Http.client.layer),
  T.runSync
)
