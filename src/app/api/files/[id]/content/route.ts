import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { readFile } from 'fs/promises'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const file = await prisma.file.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
    select: {
      filePath: true,
      fileType: true,
      originalName: true,
      fileSize: true,
    },
  })

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const data = await readFile(file.filePath)

  return new NextResponse(data, {
    headers: {
      'Content-Type': file.fileType || 'application/octet-stream',
      'Content-Length': String(file.fileSize ?? data.byteLength),
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  })
}
