'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type GalleryFile = {
  id: string
  originalName: string
  fileType: string
  fileSize: number
  createdAt: string
  folder: { id: string; name: string } | null
}

export default function NewPostClient() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [gallery, setGallery] = useState<GalleryFile[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected])

  async function loadGallery() {
    setLoadingGallery(true)
    setError('')
    try {
      const res = await fetch('/api/files', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load gallery')
      setGallery(data.files || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load gallery')
    } finally {
      setLoadingGallery(false)
    }
  }

  useEffect(() => {
    loadGallery()
  }, [])

  function toggleFile(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleUploadLocal(files: FileList | null) {
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const form = new FormData()
      for (const f of Array.from(files)) form.append('files', f)
      form.set('folderName', 'Feed Uploads')

      const res = await fetch('/api/files', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Upload failed')

      const newFiles: GalleryFile[] = data.files || []
      setGallery((prev) => [...newFiles, ...prev])
      setSelected((prev) => {
        const next = { ...prev }
        for (const f of newFiles) next[f.id] = true
        return next
      })

      setSuccess('Uploaded and selected.')
    } catch (e: any) {
      setError(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/feed/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() ? title.trim() : undefined,
          content,
          fileIds: selectedIds,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create post')

      const id = data?.post?.id
      setSuccess('Post created.')
      if (id) window.location.href = `/feed/${id}`
    } catch (e: any) {
      setError(e?.message || 'Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/feed">Back</Link>
          </Button>
        </div>
      </div>

      <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle>New Post</CardTitle>
          <CardDescription>Write an article and attach images/videos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Title (optional)</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" maxLength={120} />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Content</div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post…"
              className="w-full min-h-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Upload from local storage</div>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              disabled={uploading}
              onChange={(e) => handleUploadLocal(e.target.files)}
            />
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Uploaded files will be added to your Gallery and auto-selected.
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-medium">Pick from Gallery</div>
            <Button variant="outline" onClick={loadGallery} disabled={loadingGallery}>
              Refresh Gallery
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gallery.map((f) => {
              const checked = !!selected[f.id]
              const src = `/api/files/${f.id}/content`
              const isImage = f.fileType?.startsWith('image/')
              const isVideo = f.fileType?.startsWith('video/')

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFile(f.id)}
                  className={`text-left rounded-lg overflow-hidden border ${checked ? 'border-indigo-500' : 'border-white/20'} bg-white/40 dark:bg-slate-900/30`}
                >
                  <div className="p-2 text-xs font-medium flex items-center justify-between gap-2">
                    <span className="truncate">{f.originalName}</span>
                    <span className={`px-2 py-0.5 rounded ${checked ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{checked ? 'Selected' : 'Select'}</span>
                  </div>
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={f.originalName} className="w-full h-40 object-cover" />
                  ) : isVideo ? (
                    <video src={src} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="p-4 text-sm">Unsupported preview</div>
                  )}
                </button>
              )
            })}
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {success ? <div className="text-sm text-green-600">{success}</div> : null}

          <Button onClick={submit} disabled={submitting || uploading || !content.trim()} className="w-full">
            {submitting ? 'Posting…' : `Post (${selectedIds.length} media)`}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
