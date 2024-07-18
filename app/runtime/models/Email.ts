import * as S from '@effect/schema/Schema'
import type { Brand } from 'effect'

export type Email = typeof Email.Type

export const Email: S.Schema<string & Brand.Brand<'Email'>, string> = S.compose(S.Lowercase, S.Trim)
  .pipe(
    S.pattern(
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    ),
    S.brand('Email')
  )
  .annotations({ arbitrary: () => fc => fc.emailAddress().map(email => email as Email) })
