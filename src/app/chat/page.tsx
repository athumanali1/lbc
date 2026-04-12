import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { Button } from '@/components/ui/button'
import ChatClient from './ChatClient'

export default async function ChatPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30 dark:opacity-10" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Chat Rooms
            </h1>
            <p className="text-slate-700 dark:text-slate-300">
              Join a room and chat with members in real time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border border-white/20">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        <ChatClient />
      </div>
    </div>
  )
}
