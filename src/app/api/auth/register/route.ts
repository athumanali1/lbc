import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateQRCodeData } from '@/lib/auth'
import { getCurrentAdmin } from '@/lib/admin'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
  studentId: z.string().min(1),
  role: z.enum(['MEMBER', 'ADMIN', 'CHAIRMAN', 'CHAIRLADY', 'TREASURER', 'SECRETARY']).default('MEMBER'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  class: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { username, email, password, studentId, role, gender, class: userClass } = registerSchema.parse(body)

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { studentId },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username, email, or student ID already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)
    const qrCodeData = generateQRCodeData(studentId)

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        studentId,
        qrCodeData,
        role,
        gender,
        class: userClass,
      },
    })

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        qrCodeData: user.qrCodeData,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
