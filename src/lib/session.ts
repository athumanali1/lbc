import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export type SessionUser = {
  id: string
  username: string
  email: string
  studentId: string
  role: string
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get('auth-token')?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload?.userId) return null

  const session = await prisma.session.findUnique({
    where: { token },
  })
  if (!session) return null
  if (session.expiresAt.getTime() < Date.now()) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      email: true,
      studentId: true,
      role: true,
    },
  })

  return user ?? null
}
