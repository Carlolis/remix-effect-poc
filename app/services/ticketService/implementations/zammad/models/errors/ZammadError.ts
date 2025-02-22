/* eslint-disable @typescript-eslint/naming-convention */
import { Schema as Sc } from 'effect'

/**
 * @param error message error
 * @param error_human message error human readable
 */
export const ZammadError = Sc.Struct({
  error: Sc.String,
  error_human: Sc.String
})

export type ZammadError = Sc.Schema.Type<typeof ZammadError>
