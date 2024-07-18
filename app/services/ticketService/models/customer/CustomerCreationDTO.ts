export interface CustomerCreationDTO {
  userName: string
  firstName: string
  lastName: string
  email: string
  organization?: string
  roles: readonly ('Admin' | 'Customer')[]
}
