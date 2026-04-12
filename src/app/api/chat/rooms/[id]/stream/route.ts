import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { subscribeToRoom } from '@/lib/chatEvents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const db = prisma as any

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const membership = await db.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId: params.id, userId: user.id } },
    select: { id: true },
  })

  if (!membership) {
    return new Response('Join room first', { status: 403 })
  }

  const encoder = new TextEncoder()

  let heartbeat: any
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      send('ready', { ok: true })

      unsubscribe = subscribeToRoom(params.id, (payload) => {
        send(payload.type, payload)
      })

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`))
      }, 15000)
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat)
      if (unsubscribe) unsubscribe()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
