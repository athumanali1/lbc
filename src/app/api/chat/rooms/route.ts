import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const db = prisma as any

const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
  isPrivate: z.boolean().optional().default(false),
  maxMembers: z.number().int().min(2).max(1000).optional().default(100),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rooms = await db.chatRoom.findMany({
    where: {
      OR: [
        { isPrivate: false },
        { members: { some: { userId: user.id } } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      description: true,
      isPrivate: true,
      maxMembers: true,
      createdAt: true,
      updatedAt: true,
      creator: {
        select: { id: true, username: true, avatarUrl: true, role: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, username: true } },
        },
      },
      _count: { select: { members: true, messages: true } },
      members: {
        where: { userId: user.id },
        take: 1,
        select: { id: true, role: true, joinedAt: true, lastRead: true },
      },
    },
  })

  const unreadCounts = await Promise.all(
    rooms.map(async (r: any) => {
      const membership = r.members?.[0]
      if (!membership?.lastRead) return 0
      return db.chatMessage.count({
        where: {
          roomId: r.id,
          createdAt: { gt: membership.lastRead },
        },
      })
    })
  )

  return NextResponse.json({
    rooms: rooms.map((r: any, idx: number) => {
      const lastMessage = r.messages?.[0]
      const membership = r.members?.[0]
      return {
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        membership: membership
          ? {
              ...membership,
              joinedAt: membership.joinedAt.toISOString(),
              lastRead: membership.lastRead.toISOString(),
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt.toISOString(),
              user: lastMessage.user,
            }
          : null,
        unreadCount: membership ? unreadCounts[idx] : 0,
        members: undefined,
        messages: undefined,
      }
    }),
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createRoomSchema.parse(body)

  const room = await db.chatRoom.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      isPrivate: parsed.isPrivate,
      maxMembers: parsed.maxMembers,
      createdBy: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'ADMIN',
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      isPrivate: true,
      maxMembers: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({
    room: {
      ...room,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    },
  })
}
