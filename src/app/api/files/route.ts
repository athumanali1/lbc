import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const files = await prisma.file.findMany({
    where: { userId: user.id },
    include: { folder: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    files: files.map((f) => ({
      id: f.id,
      filename: f.filename,
      originalName: f.originalName,
      fileType: f.fileType,
      fileSize: f.fileSize,
      createdAt: f.createdAt.toISOString(),
      folder: f.folder ? { id: f.folder.id, name: f.folder.name } : null,
    })),
  })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const formData = await req.formData()
  const folderNameRaw = (formData.get('folderName') as string | null) ?? null
  const folderName = folderNameRaw?.trim() ? folderNameRaw.trim() : null

  const uploaded = formData.getAll('files')
  const files = uploaded.filter((x): x is File => x instanceof File)

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  let folderId: string | null = null
  if (folderName) {
    const existing = await prisma.folder.findFirst({
      where: {
        userId: user.id,
        name: folderName,
        parentId: null,
      },
      select: { id: true },
    })

    if (existing) {
      folderId = existing.id
    } else {
      const created = await prisma.folder.create({
        data: {
          name: folderName,
          userId: user.id,
        },
        select: { id: true },
      })
      folderId = created.id
    }
  }

  const uploadsRoot = path.join(process.cwd(), 'uploads', user.id)
  await mkdir(uploadsRoot, { recursive: true })

  const createdRows = []

  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer())

    const ext = path.extname(file.name)
    const safeExt = ext && ext.length <= 16 ? ext : ''
    const storageName = `${randomUUID()}${safeExt}`
    const diskPath = path.join(uploadsRoot, storageName)

    await writeFile(diskPath, buf)

    const row = await prisma.file.create({
      data: {
        filename: storageName,
        originalName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: buf.length,
        filePath: diskPath,
        folderId,
        userId: user.id,
      },
      include: { folder: true },
    })

    createdRows.push({
      id: row.id,
      filename: row.filename,
      originalName: row.originalName,
      fileType: row.fileType,
      fileSize: row.fileSize,
      createdAt: row.createdAt.toISOString(),
      folder: row.folder ? { id: row.folder.id, name: row.folder.name } : null,
    })
  }

  return NextResponse.json({ files: createdRows }, { status: 201 })
}
