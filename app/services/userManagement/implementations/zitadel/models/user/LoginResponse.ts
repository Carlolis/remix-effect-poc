/* eslint-disable @typescript-eslint/naming-convention */
import { Schema as Sc } from 'effect'

export const LoginResponse = Sc.Struct({
  access_token: Sc.String,
  token_type: Sc.String,
  expires_in: Sc.Number
})

export type LoginResponse = Sc.Schema.Type<typeof LoginResponse>
