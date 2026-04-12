import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { publishChatEvent } from '@/lib/chatEvents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const db = prisma as any

const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  replyToId: z.string().min(1).optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')

  const membership = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: params.id, userId: user.id } },
    select: { id: true },
  })

  if (!membership) return NextResponse.json({ error: 'Join room first' }, { status: 403 })

  const messages = await db.chatMessage.findMany({
    where: { roomId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    select: {
      id: true,
      content: true,
      type: true,
      roomId: true,
      createdAt: true,
      updatedAt: true,
      replyToId: true,
      user: {
        select: { id: true, username: true, avatarUrl: true, role: true },
      },
    },
  })

  await db.chatRoomMember.update({
    where: { roomId_userId: { roomId: params.id, userId: user.id } },
    data: { lastRead: new Date() },
  })

  const nextCursor = messages.length === 50 ? messages[messages.length - 1].id : null

  return NextResponse.json({
    messages: messages
      .map((m: any) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      }))
      .reverse(),
    nextCursor,
  })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const membership = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: params.id, userId: user.id } },
    select: { id: true },
  })

  if (!membership) return NextResponse.json({ error: 'Join room first' }, { status: 403 })

  const body = await request.json()
  const parsed = createMessageSchema.parse(body)

  const message = await db.chatMessage.create({
    data: {
      roomId: params.id,
      userId: user.id,
      content: parsed.content,
      replyToId: parsed.replyToId,
      type: 'TEXT',
    },
    select: {
      id: true,
      content: true,
      type: true,
      roomId: true,
      createdAt: true,
      updatedAt: true,
      replyToId: true,
      user: {
        select: { id: true, username: true, avatarUrl: true, role: true },
      },
    },
  })

  await db.chatRoomMember.update({
    where: { roomId_userId: { roomId: params.id, userId: user.id } },
    data: { lastRead: new Date() },
  })

  publishChatEvent({
    type: 'message',
    roomId: params.id,
    message: {
      ...message,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    },
  })

  return NextResponse.json({
    message: {
      ...message,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    },
  })
}
