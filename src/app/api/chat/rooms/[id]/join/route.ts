import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const db = prisma as any

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const room = await db.chatRoom.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      isPrivate: true,
      maxMembers: true,
      _count: { select: { members: true } },
    },
  })

  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: params.id, userId: user.id } },
    select: { id: true },
  })

  if (existing) return NextResponse.json({ ok: true })

  if (room.isPrivate) {
    return NextResponse.json({ error: 'Room is private' }, { status: 403 })
  }

  if (room._count.members >= room.maxMembers) {
    return NextResponse.json({ error: 'Room is full' }, { status: 400 })
  }

  await db.chatRoomMember.create({
    data: {
      roomId: params.id,
      userId: user.id,
      role: 'MEMBER',
    },
  })

  return NextResponse.json({ ok: true })
}
