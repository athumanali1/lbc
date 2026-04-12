'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Comment = {
  id: string
  content: string
  createdAt: string
  user: { id: string; username: string; avatarUrl: string | null; role: string }
}

type Post = {
  id: string
  title: string | null
  content: string
  createdAt: string
  updatedAt: string
  likedByMe: boolean
  _count: { likes: number; comments: number; shares: number }
  author: { id: string; username: string; avatarUrl: string | null; role: string }
  media: { id: string; file: { id: string; originalName: string; fileType: string } }[]
  comments: Comment[]
}

export default function PostDetailClient({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/feed/posts/${postId}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load post')
      setPost(data.post)
    } catch (e: any) {
      setError(e?.message || 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [postId])

  async function toggleLike() {
    if (!post) return
    const method = post.likedByMe ? 'DELETE' : 'POST'
    await fetch(`/api/feed/posts/${postId}/like`, { method })
    await load()
  }

  async function share() {
    await fetch(`/api/feed/posts/${postId}/share`, { method: 'POST' })
    await load()
  }

  async function addComment() {
    if (!comment.trim()) return
    const res = await fetch(`/api/feed/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    })
    if (res.ok) {
      setComment('')
      await load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline">
          <Link href="/feed">Back</Link>
        </Button>
        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {post ? (
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle>{post.title || 'Post'}</CardTitle>
            <CardDescription>
              By {post.author.username} ({post.author.role}) • {new Date(post.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200">{post.content}</div>

            {post.media?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {post.media.map((m) => {
                  const src = `/api/files/${m.file.id}/content`
                  const isImage = m.file.fileType?.startsWith('image/')
                  const isVideo = m.file.fileType?.startsWith('video/')
                  return (
                    <div key={m.id} className="rounded-lg overflow-hidden border border-white/20 bg-white/40 dark:bg-slate-900/30">
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={m.file.originalName} className="w-full h-64 object-cover" />
                      ) : isVideo ? (
                        <video src={src} controls className="w-full h-64 object-cover" />
                      ) : (
                        <div className="p-4 text-sm">{m.file.originalName}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button variant={post.likedByMe ? 'default' : 'outline'} onClick={toggleLike}>
                Like ({post._count.likes})
              </Button>
              <Button variant="outline" onClick={share}>
                Share ({post._count.shares})
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">Comments: {post._count.comments}</span>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Add comment</div>
              <div className="flex gap-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment" />
                <Button onClick={addComment} disabled={!comment.trim()}>
                  Send
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {post.comments.map((c) => (
                <div key={c.id} className="rounded-lg border border-white/20 bg-white/40 dark:bg-slate-900/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">
                      {c.user.username} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">({c.user.role})</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{new Date(c.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 text-sm whitespace-pre-wrap">{c.content}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
