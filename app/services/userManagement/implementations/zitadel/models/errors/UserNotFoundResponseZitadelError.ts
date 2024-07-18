import * as Sc from '@effect/schema/Schema'

export const ZitadelResponseError = Sc.Struct({
  code: Sc.Number,
  message: Sc.String
})

export type ZitadelResponseError = Sc.Schema.Type<typeof ZitadelResponseError>
