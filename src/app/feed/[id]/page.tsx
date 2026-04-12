import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import PostDetailClient from './PostDetailClient'

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30 dark:opacity-10" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <PostDetailClient postId={params.id} />
      </div>
    </div>
  )
}
