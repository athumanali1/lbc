'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QrCode, Download, ExternalLink } from 'lucide-react'

interface StudentQRCardProps {
  studentId: string
  qrCodeData: string
}

export default function StudentQRCard({ studentId, qrCodeData }: StudentQRCardProps) {
  const [qrImageDataUrl, setQrImageDataUrl] = useState<string>('')
  const [error, setError] = useState('')

  const baseUrl = useMemo(() => {
    // Force use IP address for QR codes so phones can access
    return 'http://10.140.163.50:3000'
  }, [])

  const deepLink = useMemo(() => {
    if (!baseUrl || !studentId || !qrCodeData) return ''
    const url = new URL('/qr', baseUrl)
    url.searchParams.set('studentId', studentId)
    url.searchParams.set('qrCodeData', qrCodeData)
    return url.toString()
  }, [baseUrl, studentId, qrCodeData])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!deepLink) {
        setQrImageDataUrl('')
        return
      }

      try {
        const QRCode = (await import('qrcode')).default
        const dataUrl = await QRCode.toDataURL(deepLink, {
          margin: 1,
          width: 200,
        })
        if (!cancelled) setQrImageDataUrl(dataUrl)
      } catch (e: any) {
        if (!cancelled) setError('Failed to generate QR code')
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [deepLink])

  if (!studentId || !qrCodeData) return null

  return (
    <Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          <QrCode className="h-4 w-4 text-indigo-600" />
          Your QR
        </CardTitle>
        <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
          Scan to open portal instantly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/20 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(deepLink)
              } catch {}
            }}
          >
            Copy Link
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 border border-white/20 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
            asChild
          >
            <a href={deepLink} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Test
            </a>
          </Button>
        </div>

        {qrImageDataUrl && (
          <div className="flex flex-col items-center gap-2">
            <img
              src={qrImageDataUrl}
              alt="Your portal QR code"
              className="h-32 w-32 rounded-xl bg-white p-2 border border-white/20 shadow-lg hover:shadow-xl transition-shadow duration-300"
            />
            <a
              href={qrImageDataUrl}
              download={`student-${studentId}-qr.png`}
              className="text-xs text-indigo-600 dark:text-indigo-400 underline flex items-center gap-1 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              <Download className="h-3 w-3" />
              Download
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
