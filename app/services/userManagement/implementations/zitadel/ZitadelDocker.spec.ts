import * as Http from '@effect/platform/HttpClient'
import { Effect as T, Layer as L, pipe, unsafeCoerce } from 'effect'
import type { BaseClient } from 'openid-client'

import { userManagementTest } from '../../userManagement_spec'
import { OpenIdClient } from './OidcClient'
import { makeZitadelImplementation } from './Zitadelimplementations'

const clientEffectTest: T.Effect<BaseClient> = T.succeed(
  unsafeCoerce('not implemented')
)

export const OpenIdClientLayerTest = L.effect(OpenIdClient)(clientEffectTest)

pipe(
  userManagementTest,
  T.provide(
    makeZitadelImplementation
  ),
  T.provide(Http.client.layer),
  T.provide(OpenIdClientLayerTest),
  T.runSync
)