import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, LogOut, Download, Users, FileImage, FolderOpen, User, Newspaper, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import LogoutButton from './LogoutButton'
import GalleryDashboard from './GalleryDashboard'
import StudentQRCard from './StudentQRCard'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Debug log
  console.log('Dashboard user role:', user.role, 'username:', user.username)

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { qrCodeData: true, avatarUrl: true },
  })

  const qrCodeData = fullUser?.qrCodeData ?? ''
  const avatarUrl = fullUser?.avatarUrl ?? ''

  // Stats for the dashboard (optional)
  const [userCount, fileCount] = await Promise.all([
    prisma.user.count(),
    prisma.file.count(),
  ])

  // Per-user stats for admins
  const userStats = user.role === 'ADMIN'
    ? await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          studentId: true,
          class: true,
          gender: true,
          role: true,
          _count: { select: { files: true } },
        },
        orderBy: { username: 'asc' },
      })
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30 dark:opacity-10" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/profile" className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 w-16 h-16 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <User className="h-5 w-5 text-white" />
                </div>
              </Link>
              <div>
                <p className="text-xl text-slate-700 dark:text-slate-300">
                  Welcome back, <span className="font-bold text-indigo-600 dark:text-indigo-400">{user.username}</span>
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user.role === 'ADMIN' && (
                <Button asChild variant="outline" size="sm" className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border border-white/20">
                  <Link href="/dashboard/admin">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm" className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border border-white/20">
                <Link href="/feed">
                  <Newspaper className="mr-2 h-4 w-4" />
                  Club Feed
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border border-white/20">
                <Link href="/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 border border-white/20">
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {user.role === 'ADMIN' && (
            <>
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{userCount}</div>
                  <p className="text-xs text-muted-foreground">Total members</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileImage className="h-5 w-5 text-purple-600" />
                    Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-purple-600 dark:text-purple-400">{fileCount}</div>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700">{user.role}</span>
                Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.role}</div>
              <p className="text-xs text-muted-foreground">Your access level</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderOpen className="h-5 w-5 text-green-600" />
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-green-600 dark:text-green-400">Active</div>
              <p className="text-xs text-muted-foreground">System healthy</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Analytics Table */}
        {user.role === 'ADMIN' && userStats.length > 0 && (
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-xl mb-10">
            <CardHeader>
              <CardTitle className="text-lg">User Upload Analytics</CardTitle>
              <CardDescription>Files uploaded per user</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Files</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userStats.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>{u.studentId}</TableCell>
                      <TableCell>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700">
                          {u.class || 'Not set'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700">
                          {u.gender || 'Not set'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700">{u.role}</span>
                      </TableCell>
                      <TableCell className="text-right">{u._count.files}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main content */}
          <main>
            <GalleryDashboard />
          </main>

          {/* Sidebar: QR Card */}
          <aside className="lg:sticky lg:top-10 lg:h-fit space-y-4">
            <StudentQRCard studentId={user.studentId} qrCodeData={qrCodeData} />
          </aside>
        </div>
      </div>
    </div>
  )
}
