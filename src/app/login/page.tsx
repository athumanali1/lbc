'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, QrCode, User } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQRLogin = async (studentId: string, qrData: string) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/qr-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId, qrCodeData: qrData }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'QR login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Student Club Portal</CardTitle>
          <CardDescription>
            Sign in to access your personal dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials">Login</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="credentials" className="space-y-4">
              <CredentialsForm onLogin={handleLogin} isLoading={isLoading} />
            </TabsContent>
            
            <TabsContent value="qr" className="space-y-4">
              <QRLoginForm onQRLogin={handleQRLogin} isLoading={isLoading} />
              <QrScanner
                onScanned={({ studentId, qrCodeData }: { studentId: string; qrCodeData: string }) =>
                  handleQRLogin(studentId, qrCodeData)
                }
                disabled={isLoading}
              />
            </TabsContent>
          </Tabs>
          
          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CredentialsForm({ onLogin, isLoading }: { onLogin: (username: string, password: string) => void, isLoading: boolean }) {
  const [formData, setFormData] = useState({ username: '', password: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(formData.username, formData.password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Enter your username"
          value={formData.username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, username: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <User className="mr-2 h-4 w-4" />
            Sign In
          </>
        )}
      </Button>
    </form>
  )
}

function QrScanner({
  onScanned,
  disabled,
}: {
  onScanned: (data: { studentId: string; qrCodeData: string }) => void
  disabled: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [isSupported, setIsSupported] = useState(true)

  const stopScan = () => {
    const video = document.getElementById('qr-video') as HTMLVideoElement | null
    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
    setIsOpen(false)
  }

  const startScan = async () => {
    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window
    if (!hasBarcodeDetector) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)
    setIsOpen(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      const video = document.getElementById('qr-video') as HTMLVideoElement | null
      if (!video) return

      video.srcObject = stream
      await video.play()

      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })

      const loop = async () => {
        if (!video.srcObject) return
        if (video.readyState < 2) return requestAnimationFrame(loop)

        try {
          const barcodes = await detector.detect(video)
          if (barcodes?.length) {
            const rawValue = barcodes[0]?.rawValue ?? ''
            if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
              try {
                const url = new URL(rawValue)
                const studentId = url.searchParams.get('studentId') ?? ''
                const qrCodeData = url.searchParams.get('qrCodeData') ?? ''
                if (studentId && qrCodeData) {
                  onScanned({ studentId, qrCodeData })
                  stopScan()
                  return
                }
              } catch {
              }
            } else {
              const [studentId, qrCodeData] = rawValue.split('|')
              if (studentId && qrCodeData) {
                onScanned({ studentId, qrCodeData })
                stopScan()
                return
              }
            }
          }
        } catch (e) {
        }

        requestAnimationFrame(loop)
      }

      requestAnimationFrame(loop)
    } catch (e: any) {
      setCameraError(e?.message || 'Unable to access camera')
      setIsOpen(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={isOpen ? stopScan : startScan}
        disabled={disabled}
      >
        <QrCode className="mr-2 h-4 w-4" />
        {isOpen ? 'Stop camera scan' : 'Scan QR with camera'}
      </Button>

      {!isSupported && (
        <div className="text-xs text-muted-foreground">
          Camera scanning isn’t supported in this browser. You can still paste QR data above.
        </div>
      )}

      {cameraError && <div className="text-xs text-destructive">{cameraError}</div>}

      {isOpen && (
        <div className="overflow-hidden rounded-md border bg-muted">
          <video id="qr-video" className="h-48 w-full object-cover" playsInline muted />
        </div>
      )}
    </div>
  )
}

function QRLoginForm({ onQRLogin, isLoading }: { onQRLogin: (studentId: string, qrData: string) => void, isLoading: boolean }) {
  const [formData, setFormData] = useState({ studentId: '', qrData: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onQRLogin(formData.studentId, formData.qrData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">Student ID</Label>
        <Input
          id="studentId"
          type="text"
          placeholder="Enter your student ID"
          value={formData.studentId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, studentId: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="qrData">QR Code Data</Label>
        <Input
          id="qrData"
          type="text"
          placeholder="Scan QR code or enter data"
          value={formData.qrData}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, qrData: e.target.value })}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <QrCode className="mr-2 h-4 w-4" />
            Sign In with QR
          </>
        )}
      </Button>
    </form>
  )
}
