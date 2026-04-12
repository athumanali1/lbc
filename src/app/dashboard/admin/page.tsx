import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/admin'
import LogoutButton from '../LogoutButton'
import CreateUserForm from './CreateUserForm'
import UserList from './UserList'

export default async function AdminPage() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground mt-2">Create new users for the club portal.</p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-8 space-y-8">
          <CreateUserForm />
          <UserList />
        </div>
      </div>
    </div>
  )
}
