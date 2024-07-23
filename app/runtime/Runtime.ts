import * as Http from '@effect/platform/HttpClient'
import {
  Layer,
  Layer as L,
  Logger,
  LogLevel,
  pipe
} from 'effect'

import { Path } from '@effect/platform'
import { NodeFileSystem } from '@effect/platform-node'
import { makeZammadImplementation } from '../services/ticketService/implementations/zammad/ZammadImplementation'
import { OpenIdClientLayer } from '../services/userManagement/implementations/zitadel/OidcClient'
import { makeZitadelImplementation } from '../services/userManagement/implementations/zitadel/Zitadelimplementations'



export const AppLayer = pipe(
  makeZammadImplementation,
  L.provideMerge(makeZitadelImplementation),

  L.provideMerge(OpenIdClientLayer),
  L.provideMerge(NodeFileSystem.layer),
  L.provideMerge(Path.layer),
  L.provide(Http.client.layer),
).pipe(Layer.provide(Logger.minimumLogLevel(LogLevel.All)))
