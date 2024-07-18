import * as Sc from '@effect/schema/Schema'
import * as B from 'effect/Brand'

export type MachineUser = string & B.Brand<'MachineUser'>
export const MachineUser = B.nominal<MachineUser>()
export const MachineUserSchema = Sc.fromBrand(MachineUser)(Sc.String)
