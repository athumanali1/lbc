import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const db = prisma as any

const createPostSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  content: z.string().trim().min(1).max(5000),
  fileIds: z.array(z.string().min(1)).max(10).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const posts = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          role: true,
        },
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
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true,
        },
      },
      likes: {
        where: { userId: user.id },
        select: { id: true },
        take: 1,
      },
    },
  })

  return NextResponse.json({
    posts: posts.map((p: any) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      likedByMe: p.likes.length > 0,
      likes: undefined,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, content, fileIds } = createPostSchema.parse(body)

  if (fileIds?.length) {
    const ownedCount = await prisma.file.count({
      where: {
        id: { in: fileIds },
        userId: user.id,
      },
    })

    if (ownedCount !== fileIds.length) {
      return NextResponse.json({ error: 'One or more files are not accessible' }, { status: 403 })
    }
  }

  const post = await db.post.create({
    data: {
      authorId: user.id,
      title: title?.trim() ? title.trim() : null,
      content,
      media: fileIds?.length
        ? {
            create: fileIds.map((fileId) => ({
              fileId,
            })),
          }
        : undefined,
    },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(
    {
      post: {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      },
    },
    { status: 201 }
  )
}
