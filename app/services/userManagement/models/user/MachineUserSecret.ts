import { Schema as Sc } from 'effect'
import * as B from 'effect/Brand'

export type MachineUser = string & B.Brand<'MachineUser'>
export const MachineUser = B.nominal<MachineUser>()
export const MachineUserSchema = Sc.fromBrand(MachineUser)(Sc.String)
