import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  username: z.string().min(1).max(50),
  email: z.string().email(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      studentId: true,
      role: true,
      createdAt: true,
      avatarUrl: true,
    },
  })

  if (!fullUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: fullUser })
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { username, email } = updateProfileSchema.parse(body)

    // Check if username or email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
        NOT: { id: user.id },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { username, email },
      select: {
        id: true,
        username: true,
        email: true,
        studentId: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
      },
    })

    return NextResponse.json({ message: 'Profile updated', user: updatedUser })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Invalid request or internal error' },
      { status: 400 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // Fetch user with password hash
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })

    if (!fullUser?.passwordHash) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Simple password verification (replace with bcrypt compare in production)
    const currentPasswordHash = await hashPassword(currentPassword)
    const isCurrentPasswordValid = currentPasswordHash === fullUser.passwordHash
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const newPasswordHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    return NextResponse.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'Invalid request or internal error' },
      { status: 400 }
    )
  }
}
