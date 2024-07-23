import type * as FileSystem from '@effect/platform/FileSystem'
import type * as Path from '@effect/platform/Path'
import type { ParseError, Unexpected } from '@effect/schema/ParseResult'
import type { TypedDeferredData, TypedResponse } from '@remix-run/node'
import { json, unstable_defineAction, unstable_defineLoader } from '@remix-run/node'
import type { Params as RemixParams } from '@remix-run/react'
import type {
  Option,
  Ref,
  Scope
} from 'effect'
import {
  Cause,
  Context,
  Effect as T,
  Exit,
  Layer,
  ManagedRuntime,
  Match
} from 'effect'
import type { NoSuchElementException } from 'effect/Cause'

import { ResponseHeaders } from './ResponseHeaders'
import { AppLayer } from './Runtime'

import type { HttpServer } from '@effect/platform'

import {
  type FormError,
  type NotFound,
  type Redirect,
} from './ServerResponse'
import { fromWeb, ServerRequest } from '@effect/platform/Http/ServerRequest'
import { CookieSessionStorage } from './services/CookieSessionStorage'

// import { OAuth } from "./internals/oauth/OAuth";

const runtime = ManagedRuntime.make(AppLayer)

interface Params {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly _: unique symbol
}
const Params = Context.GenericTag<Params, RemixParams>('@services/Params')

interface ResponseStatus {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly _: unique symbol
}
const ResponseStatus = Context.GenericTag<ResponseStatus, Ref.Ref<Option.Option<number>>>(
  '@services/ResponseStatus'
)

type AppEnv = Layer.Layer.Success<typeof AppLayer>

type RequestEnv =
  | HttpServer.request.ServerRequest
  | FileSystem.FileSystem
  | Params
  | Scope.Scope
  | Path.Path
  | ResponseHeaders
  | CookieSessionStorage

type ActionError = Redirect | Unexpected | FormError | ParseError

type RemixActionHandler<A, R,> = T.Effect<
  A,
  ActionError,
  R | AppEnv | RequestEnv
>
type LoaderError = Redirect | NotFound | Unexpected | NoSuchElementException

type RemixLoaderHandler<A extends Serializable, R,> = T.Effect<
  A,
  LoaderError,
  R | AppEnv | RequestEnv
>
type DataFunctionReturnValue =
  | Serializable
  | TypedDeferredData<Record<string, unknown>>
  | TypedResponse<Record<string, unknown>>
type Serializable =
  | undefined
  | null
  | boolean
  | string
  | symbol
  | number
  | Array<Serializable>
  | {
    [key: PropertyKey]: Serializable
  }
  | bigint
  | Date
  | URL
  | RegExp
  | Error
  | Map<Serializable, Serializable>
  | Set<Serializable>
  | Promise<Serializable>
  | object

type RemixLoader = Parameters<typeof unstable_defineLoader>[0]
type LoaderArgs = Parameters<RemixLoader>[0]

type RemixAction = Parameters<typeof unstable_defineAction>[0]
type ActionArgs = Parameters<RemixAction>[0]

const makeRequestContext = (
  args: LoaderArgs | ActionArgs
): Layer.Layer<ServerRequest | ResponseHeaders | Params, never, never> => {
  const context = Context.empty().pipe(
    Context.add(ServerRequest, fromWeb(args.request)),
    Context.add(Params, args.params),
    Context.add(ResponseHeaders, args.request.headers),
    Layer.succeedContext
  )

  return context
}



const matchLoaderError = Match.typeTags<Redirect | NotFound | Unexpected | NoSuchElementException>()

const matchActionError = Match.typeTags<ActionError>()

const handleFailedResponse = <E extends Serializable,>(cause: Cause.Cause<E>) => {
  if (Cause.isFailType(cause)) {
    throw cause.error
  }

  throw Cause.pretty(cause)
}

export const action = <A extends DataFunctionReturnValue, R extends AppEnv | RequestEnv,>(
  effect: RemixActionHandler<A, R>
) =>
  unstable_defineAction(args => {
    const runnable = effect.pipe(
      T.tapError(e =>
        T.sync(() =>
          matchActionError({
            Unexpected: () => (args.response.status = 500),
            FormError: () => (args.response.status = 400),
            Redirect(e) {
              args.response.status = 302
              args.response.headers.set('Location', e.location)
              args.response.headers.set('Set-Cookie', e.headers?.['Set-Cookie'] ?? '')
            },
            ParseError: () => (args.response.status = 400)
          })(e)
        )
      ),
      T.catchTag('FormError', e => T.succeed(e.toJSON())), // TODO: map FormError to ErrorResponse

      T.provide(CookieSessionStorage.layer),
      T.provide(makeRequestContext(args)),
      T.scoped,
      T.exit
    )

    return runtime.runPromise(runnable).then(Exit.getOrElse(handleFailedResponse)) as Promise<
      FormError
    >
  })

export const loader = <A extends Serializable, R extends AppEnv | RequestEnv,>(
  effect: RemixLoaderHandler<A, R>
) =>
  // @ts-expect-error toto
  unstable_defineLoader(args => {
    const runnable = effect.pipe(
      T.tapError(e =>
        T.sync(() =>
          matchLoaderError({
            Unexpected: () => (args.response.status = 500),
            NotFound: () => (args.response.status = 404),
            Redirect(e) {
              args.response.status = 302
              args.response.headers.set('Location', e.location)
            },
            NoSuchElementException: () => (args.response.status = 500)
          })(e)
        )
      ),
      T.scoped,
      T.provide(CookieSessionStorage.layer),
      T.provide(makeRequestContext(args)),
      T.exit
    )

    return runtime.runPromise(runnable).then(
      Exit.getOrElse(cause => {
        if (Cause.isFailType(cause)) {
          throw json(cause.error.toString, {
            status: args.response.status || 500,
            headers: args.response.headers
          })
        }

        throw Cause.pretty(cause)
      })
    ) as Promise<A>
  })

export const unwrapLoader = <
  A1 extends Serializable,
  R1 extends AppEnv | RequestEnv,
  E,
  R2 extends AppEnv,
>(
  effect: T.Effect<RemixLoaderHandler<A1, R1>, E, R2>
) => {
  const awaitedHandler = runtime.runPromise(effect).then(loader)

  return (args: LoaderArgs): Promise<A1> => {

    // @ts-expect-error fffff
    return awaitedHandler.then(handler => handler(args))
  }
}

export const unwrapAction = <
  A1 extends DataFunctionReturnValue,
  R1 extends AppEnv | RequestEnv,
  E,
  R2 extends AppEnv,
>(
  effect: T.Effect<RemixActionHandler<A1, R1>, E, R2>
) => {
  const awaitedHandler = runtime.runPromise(effect).then(action)

  return (args: ActionArgs): Promise<FormError> => awaitedHandler.then(handler => handler(args))
}

export const Remix = { action, loader, unwrapLoader, unwrapAction }
