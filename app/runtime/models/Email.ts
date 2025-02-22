import { Schema as Sc } from 'effect'
import type { Brand } from 'effect'

export type Email = typeof Email.Type

export const Email: Sc.Schema<string & Brand.Brand<'Email'>, string> = Sc.compose(
  Sc.Lowercase,
  Sc.Trim
)
  .pipe(
    Sc.pattern(
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    ),
    Sc.brand('Email')
  )
  .annotations({ arbitrary: () => fc => fc.emailAddress().map(email => email as Email) })
