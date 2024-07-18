import type { UserId } from './UserId'

export interface UserOutputDTO {
  userId: UserId
  userName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}
