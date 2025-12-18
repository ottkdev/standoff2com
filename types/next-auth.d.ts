import { UserRole } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      email: string
      role: UserRole
      isVerified: boolean
    }
  }

  interface User {
    id: string
    username: string
    email: string
    role: UserRole
    isVerified: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: UserRole
    isVerified: boolean
  }
}

