import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import { z } from 'zod'

const qrLoginSchema = z.object({
  studentId: z.string().min(1),
  qrCodeData: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, qrCodeData } = qrLoginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { studentId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Student ID not found' },
        { status: 404 }
      )
    }

    if (user.qrCodeData !== qrCodeData) {
      return NextResponse.json(
        { error: 'Invalid QR code' },
        { status: 401 }
      )
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      studentId: user.studentId,
      role: user.role,
      createdAt: user.createdAt,
    })

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error('QR Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
