'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Bir Hata Oluştu</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Üzgünüz, beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs font-mono text-destructive break-words">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} variant="default" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tekrar Dene
            </Button>
            <Link href="/">
              <Button variant="outline" className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Ana Sayfa
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

