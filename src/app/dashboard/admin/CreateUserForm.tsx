'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, UserPlus } from 'lucide-react'
import QRCode from 'qrcode'

export default function CreateUserForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    studentId: '',
    role: 'MEMBER',
    gender: '',
    class: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [createdQrCodeData, setCreatedQrCodeData] = useState<string>('')
  const [createdStudentId, setCreatedStudentId] = useState<string>('')
  const [qrImageDataUrl, setQrImageDataUrl] = useState<string>('')

  const baseUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.origin
  }, [])

  const deepLink = useMemo(() => {
    if (!baseUrl || !createdStudentId || !createdQrCodeData) return ''
    const url = new URL('/qr', baseUrl)
    url.searchParams.set('studentId', createdStudentId)
    url.searchParams.set('qrCodeData', createdQrCodeData)
    return url.toString()
  }, [baseUrl, createdStudentId, createdQrCodeData])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!deepLink) {
        setQrImageDataUrl('')
        return
      }

      try {
        const dataUrl = await QRCode.toDataURL(deepLink, {
          margin: 1,
          width: 320,
        })
        if (!cancelled) setQrImageDataUrl(dataUrl)
      } catch {
        if (!cancelled) setQrImageDataUrl('')
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [deepLink])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRoleChange = (value: string) => {
    setFormData({ ...formData, role: value })
  }

  const handleGenderChange = (value: string) => {
    setFormData({ ...formData, gender: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setCreatedQrCodeData('')
    setCreatedStudentId('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ User "${formData.username}" created successfully.`)
        setCreatedQrCodeData(data?.user?.qrCodeData ?? '')
        setCreatedStudentId(data?.user?.studentId ?? formData.studentId)
        setFormData({ username: '', email: '', password: '', studentId: '', role: 'MEMBER', gender: '', class: '' })
      } else {
        setMessage(`❌ ${data.error || 'Failed to create user'}`)
      }
    } catch {
      setMessage('❌ Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create New User
        </CardTitle>
        <CardDescription>
          Fill in the details to create a new club portal user.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="jdoe"
                value={formData.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jdoe@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="studentId" className="text-sm font-medium">
                Student ID
              </label>
              <Input
                id="studentId"
                name="studentId"
                type="text"
                placeholder="S1001"
                value={formData.studentId}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="CHAIRMAN">Chairman</SelectItem>
                  <SelectItem value="CHAIRLADY">Chairlady</SelectItem>
                  <SelectItem value="TREASURER">Treasurer</SelectItem>
                  <SelectItem value="SECRETARY">Secretary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={handleGenderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Input
              id="class"
              name="class"
              type="text"
              placeholder="e.g., Grade 10A, Form 3B"
              value={formData.class}
              onChange={handleChange}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating User…
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create User
              </>
            )}
          </Button>

          {message && (
            <Alert variant={message.startsWith('✅') ? 'default' : 'destructive'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {deepLink && (
            <div className="space-y-3 rounded-md border p-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">ID Card QR Link</div>
                <div className="break-all text-xs text-muted-foreground">{deepLink}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(deepLink)
                      setMessage('✅ QR link copied to clipboard.')
                    } catch {
                      setMessage('❌ Failed to copy QR link.')
                    }
                  }}
                >
                  Copy Link
                </Button>

                <Button type="button" variant="secondary" asChild>
                  <a href={deepLink} target="_blank" rel="noreferrer">
                    Open Link
                  </a>
                </Button>
              </div>

              {qrImageDataUrl && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={qrImageDataUrl}
                    alt="Student portal QR code"
                    className="h-56 w-56 rounded bg-white p-2"
                  />
                  <a
                    href={qrImageDataUrl}
                    download={`student-${createdStudentId}-qr.png`}
                    className="text-xs text-muted-foreground underline"
                  >
                    Download QR image
                  </a>
                </div>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
