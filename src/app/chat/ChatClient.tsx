'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type ChatRoom = {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  maxMembers: number
  createdAt: string
  updatedAt: string
  creator: { id: string; username: string; avatarUrl: string | null; role: string }
  _count: { members: number; messages: number }
  membership: null | { id: string; role: string; joinedAt: string; lastRead: string }
  lastMessage?: null | { id: string; content: string; createdAt: string; user: { id: string; username: string } }
  unreadCount?: number
}

export default function ChatClient() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const canCreate = useMemo(() => name.trim().length > 0 && !loading, [name, loading])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/chat/rooms', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load rooms')
      setRooms(data.rooms || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const es = new EventSource('/api/chat/stream')
    let t: any

    const scheduleRefresh = () => {
      if (t) clearTimeout(t)
      t = setTimeout(() => {
        load()
      }, 250)
    }

    es.addEventListener('message', scheduleRefresh as any)
    es.onerror = () => {
      // auto-reconnect
    }

    return () => {
      if (t) clearTimeout(t)
      es.removeEventListener('message', scheduleRefresh as any)
      es.close()
    }
  }, [])

  async function createRoom() {
    if (!canCreate) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create room')
      setName('')
      setDescription('')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  async function join(roomId: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/join`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to join room')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle>Create a room</CardTitle>
          <CardDescription>Rooms are public by default. You will be added automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. General" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Description</div>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={createRoom} disabled={!canCreate}>
              Create
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl overflow-hidden">
        <CardHeader>
          <CardTitle>Chats</CardTitle>
          <CardDescription>Tap a room to open it.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/20">
            {rooms.map((room) => {
              const joined = !!room.membership
              const last = room.lastMessage
              const preview = last?.content ? last.content : room.description || 'No messages yet'
              const timeLabel = last?.createdAt
                ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date(room.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

              const unread = joined ? Number(room.unreadCount || 0) : 0

              return (
                <div key={room.id} className="px-4 py-3 hover:bg-white/40 dark:hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold shadow">
                      {room.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{room.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{timeLabel}</div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
                          {last ? (
                            <span className="opacity-80">{last.user.username}: </span>
                          ) : null}
                          {preview}
                        </div>
                        {unread > 0 ? (
                          <div className="min-w-[22px] h-[22px] px-2 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                            {unread > 99 ? '99+' : unread}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {joined ? (
                        <Button asChild size="sm" className="rounded-full">
                          <Link href={`/chat/${room.id}`}>Open</Link>
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => join(room.id)} disabled={loading || room.isPrivate} className="rounded-full">
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                  {room.isPrivate ? (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Private room</div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
