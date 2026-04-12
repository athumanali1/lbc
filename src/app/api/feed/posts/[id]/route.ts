import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const db = prisma as any

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const post = await db.post.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: { id: true, username: true, avatarUrl: true, role: true },
      },
      media: {
        select: {
          id: true,
          file: {
            select: {
              id: true,
              originalName: true,
              fileType: true,
              fileSize: true,
              createdAt: true,
            },
          },
        },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true, avatarUrl: true, role: true } },
        },
      },
      _count: {
        select: { likes: true, comments: true, shares: true },
      },
      likes: {
        where: { userId: user.id },
        select: { id: true },
        take: 1,
      },
    },
  })

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    post: {
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      likedByMe: post.likes.length > 0,
      likes: undefined,
      comments: post.comments.map((c: any) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    },
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const post = await db.post.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true },
  })

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = user.role === 'ADMIN'
  const isAuthor = post.authorId === user.id
  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.post.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Deleted' })
}
