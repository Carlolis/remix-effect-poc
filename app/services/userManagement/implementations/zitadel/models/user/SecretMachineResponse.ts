import * as Sc from '@effect/schema/Schema'

export const SecretMachineResponse = Sc.Struct({
  clientSecret: Sc.String,
  clientId: Sc.String
})

export type SecretMachineResponse = Sc.Schema.Type<typeof SecretMachineResponse>
