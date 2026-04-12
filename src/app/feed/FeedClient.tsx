'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type FeedPost = {
  id: string
  title: string | null
  content: string
  createdAt: string
  updatedAt: string
  likedByMe: boolean
  _count: { likes: number; comments: number; shares: number }
  author: { id: string; username: string; avatarUrl: string | null; role: string }
  media: { id: string; file: { id: string; originalName: string; fileType: string; fileSize: number; createdAt: string } }[]
}

export default function FeedClient() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/feed/posts', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load feed')
      setPosts(data.posts || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleLike(postId: string, liked: boolean) {
    const method = liked ? 'DELETE' : 'POST'
    const res = await fetch(`/api/feed/posts/${postId}/like`, { method })
    if (!res.ok) return
    await load()
  }

  async function share(postId: string) {
    await fetch(`/api/feed/posts/${postId}/share`, { method: 'POST' })
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {loading ? 'Loading…' : `${posts.length} posts`}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button asChild>
            <Link href="/feed/new">New Post</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {posts.map((p) => (
        <Card key={p.id} className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <Link href={`/feed/${p.id}`} className="hover:underline">
                {p.title || 'Post'}
              </Link>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {new Date(p.createdAt).toLocaleString()}
              </span>
            </CardTitle>
            <CardDescription>
              By {p.author.username} ({p.author.role})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200">{p.content}</div>

            {p.media?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {p.media.map((m) => {
                  const src = `/api/files/${m.file.id}/content`
                  const isVideo = m.file.fileType?.startsWith('video/')
                  const isImage = m.file.fileType?.startsWith('image/')

                  return (
                    <div key={m.id} className="rounded-lg overflow-hidden border border-white/20 bg-white/40 dark:bg-slate-900/30">
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={m.file.originalName} className="w-full h-64 object-cover" />
                      ) : isVideo ? (
                        <video src={src} controls className="w-full h-64 object-cover" />
                      ) : (
                        <div className="p-4 text-sm text-slate-700 dark:text-slate-300">
                          {m.file.originalName}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button variant={p.likedByMe ? 'default' : 'outline'} onClick={() => toggleLike(p.id, p.likedByMe)}>
                Like ({p._count.likes})
              </Button>
              <Button asChild variant="outline">
                <Link href={`/feed/${p.id}`}>Comments ({p._count.comments})</Link>
              </Button>
              <Button variant="outline" onClick={() => share(p.id)}>
                Share ({p._count.shares})
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
