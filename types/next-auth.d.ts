import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    name: string
    username: string
    email: string
    avatarUrl?: string
    isActive?: boolean
    lastSeen?: Date
  }

  interface Session {
    user: {
      id: string
      name: string
      username: string
      email: string
      avatarUrl?: string
    }
  }
}