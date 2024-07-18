import type * as S from '@effect/schema'
import type { Record } from 'effect'
import { Data } from 'effect'



export interface FormErrorValue {
  values: unknown
  errors: Record<string, { message: string; type: S.ArrayFormatter.Issue['_tag'] }>
}

export class FormError extends Data.TaggedError('FormError')<FormErrorValue> { }

export class Redirect
  extends Data.TaggedError('Redirect')<{ location: string; headers?: { 'Set-Cookie': string } }> { }

export class NotFound extends Data.TaggedError('NotFound') { }

export class Unexpected extends Data.TaggedError('Unexpected')<{ error: string }> { }

export const ServerResponse = {
  FormError: (params: FormErrorValue) => new FormError(params),
  FormRootError: (message: string) =>
    new FormError({ errors: { root: { type: 'Type', message } }, values: {} }),
  Unexpected: <E extends { _tag: string },>(e: E) => new Unexpected({ error: e._tag }),
  NotFound: new NotFound(),
  Redirect: (p: { location: string; headers?: { 'Set-Cookie': string } }) => {

    return new Redirect({ location: p.location, headers: p.headers })
  },
}
