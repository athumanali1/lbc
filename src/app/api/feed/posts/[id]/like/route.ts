import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const db = prisma as any

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.postLike.upsert({
    where: { postId_userId: { postId: params.id, userId: user.id } },
    create: { postId: params.id, userId: user.id },
    update: {},
  })

  return NextResponse.json({ liked: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.postLike.deleteMany({
    where: { postId: params.id, userId: user.id },
  })

  return NextResponse.json({ liked: false })
}
