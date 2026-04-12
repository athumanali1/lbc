'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Message = {
  id: string
  content: string
  type: string
  roomId: string
  replyToId: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; username: string; avatarUrl: string | null; role: string }
}

export default function RoomClient({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [joined, setJoined] = useState(false)
  const [meId, setMeId] = useState<string>('')
  const [meRole, setMeRole] = useState<string>('')
  const seenIdsRef = useRef<Set<string>>(new Set())

  const bottomRef = useRef<HTMLDivElement | null>(null)

  const canSend = useMemo(() => content.trim().length > 0 && !loading, [content, loading])

  async function tryJoin() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/join`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to join room')
      setJoined(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to join room')
      setJoined(false)
    } finally {
      setLoading(false)
    }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) {
          setJoined(false)
          return
        }
        throw new Error(data?.error || 'Failed to load messages')
      }
      setMessages(data.messages || [])
      seenIdsRef.current = new Set((data.messages || []).map((m: any) => m.id))
      setJoined(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  async function send() {
    if (!canSend) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to send message')
      setContent('')
      setMessages((prev) => [...prev, data.message])
      setJoined(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [roomId])

  useEffect(() => {
    let cancelled = false
    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setMeId(data?.user?.id || '')
          setMeRole(data?.user?.role || '')
        }
      } catch {}
    }

    loadMe()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!joined) return
    if (typeof window === 'undefined') return

    const es = new EventSource(`/api/chat/rooms/${roomId}/stream`)

    const onMessage = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data)
        const msg = payload?.message
        if (!msg?.id) return
        if (seenIdsRef.current.has(msg.id)) return
        seenIdsRef.current.add(msg.id)
        setMessages((prev) => [...prev, msg])
      } catch {}
    }

    es.addEventListener('message', onMessage as any)

    const onDeleted = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data)
        const messageId = payload?.messageId
        if (!messageId) return
        seenIdsRef.current.delete(messageId)
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      } catch {}
    }

    es.addEventListener('message_deleted', onDeleted as any)
    es.onerror = () => {
      // Browser will auto-reconnect; no-op
    }

    return () => {
      es.removeEventListener('message', onMessage as any)
      es.removeEventListener('message_deleted', onDeleted as any)
      es.close()
    }
  }, [roomId, joined])

  async function deleteMessage(messageId: string) {
    setError('')
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to delete message')
      seenIdsRef.current.delete(messageId)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    } catch (e: any) {
      setError(e?.message || 'Failed to delete message')
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle>Messages</CardTitle>
      </CardHeaderconst canDelete = mine || meRole === 'ADMIN'
                  >
      <CardContent className="p-0">
        {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}

        {!joined ? (
          <div className="px-6 pb-4 flex items-center gap-2">
            <Button onClick={tryJoin} disabled={loading}>
              Join room
            </Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              Retry
            </Button>
          </div>
        ) : null}"mt-1 flex items-center justify-end gap-2">
                          canDelete ? (
                            <button
                              type="button"
                              onClick={() => deleteMessage(.d)}
                              className={mihover:white undelne underline-offse-200 hover:text-slate-7dark:hover:t-slae200 underline undeline-offset-2'}
                            >
                              Delete
                            </button>
                          ) : null}
                          <div className={mne ? 'text-[10px] text-wite/80' : 'text-[10px] text-slate-500 dark:text-slae-400
  
                          </div>
        <div className="px-6 pb-6">
          <div className="rounded-2xl border border-white/20 shadow-inner overflow-hidden">
            <div
              className="h-[520px] flex flex-col"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.10)',
                backgroundImage:
                  'radial-gradient(rgba(15, 23, 42, 0.12) 1px, transparent 1px), radial-gradient(rgba(15, 23, 42, 0.07) 1px, transparent 1px)',
                backgroundPosition: '0 0, 14px 14px',
                backgroundSize: '28px 28px',
              }}
            >
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
                {messages.map((m) => {
                  const mine = !!meId && m.user.id === meId
                  return (
                    <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                      <div
                        className={
                          mine
                            ? 'max-w-[80%] rounded-2xl rounded-tr-sm bg-emerald-500 text-white shadow px-3 py-2'
                            : 'max-w-[80%] rounded-2xl rounded-tl-sm bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 shadow px-3 py-2'
                        }
                      >
                        {!mine ? (
                          <div className="text-[11px] font-semibold opacity-80 mb-0.5">{m.user.username}</div>
                        ) : null}
                        <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                        <div className={mine ? 'text-[10px] mt-1 text-white/80 text-right' : 'text-[10px] mt-1 text-slate-500 dark:text-slate-400 text-right'}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-white/20 bg-white/80 dark:bg-slate-900/70 backdrop-blur px-3 py-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Message"
                    className="bg-white/90 dark:bg-slate-950/40 rounded-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                  />
                  <Button onClick={send} disabled={!canSend} className="rounded-full">
                    Send
                  </Button>
                  <Button variant="outline" onClick={load} disabled={loading} className="rounded-full">
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
