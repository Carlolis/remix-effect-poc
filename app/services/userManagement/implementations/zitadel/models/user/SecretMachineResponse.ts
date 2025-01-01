import { Schema as Sc } from 'effect'

export const SecretMachineResponse = Sc.Struct({
  clientSecret: Sc.String,
  clientId: Sc.String
})

export type SecretMachineResponse = Sc.Schema.Type<typeof SecretMachineResponse>
