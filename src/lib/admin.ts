import { getCurrentUser, type SessionUser } from './session'

export async function getCurrentAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN' ? user : null
}

export function assertAdmin(user: SessionUser | null): asserts user is SessionUser {
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
}
