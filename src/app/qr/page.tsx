'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

function QrAutoLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  const studentId = searchParams.get('studentId') ?? ''
  const qrCodeData = searchParams.get('qrCodeData') ?? ''

  const payload = useMemo(() => ({ studentId, qrCodeData }), [studentId, qrCodeData])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!payload.studentId || !payload.qrCodeData) {
        setError('Invalid QR link. Missing required parameters.')
        return
      }

      try {
        const res = await fetch('/api/auth/qr-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          if (!cancelled) setError(data?.error || 'QR login failed')
          return
        }

        router.replace('/dashboard')
      } catch {
        if (!cancelled) setError('Network error. Please try again.')
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [payload, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Signing you in…</CardTitle>
          <CardDescription>
            Please wait while we open your portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    }>
      <QrAutoLoginPage />
    </Suspense>
  )
}
