import { Schema as Sc } from 'effect'

export const ZitadelResponseError = Sc.Struct({
  code: Sc.Number,
  message: Sc.String
})

export type ZitadelResponseError = Sc.Schema.Type<typeof ZitadelResponseError>
