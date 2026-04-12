import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { publishChatEvent } from '@/lib/chatEvents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const db = prisma as any

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const message = await db.chatMessage.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, roomId: true },
  })

  if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = message.userId === user.id
  const isAdmin = user.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isAdmin) {
    const membership = await db.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId: message.roomId, userId: user.id } },
      select: { id: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Join room first' }, { status: 403 })
    }
  }

  await db.chatMessage.delete({ where: { id: message.id } })

  publishChatEvent({
    type: 'message_deleted',
    roomId: message.roomId,
    messageId: message.id,
  })

  return NextResponse.json({ ok: true })
}
