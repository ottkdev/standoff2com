import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">404 - Sayfa Bulunamadı</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="default" className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Ana Sayfa
              </Button>
            </Link>
            <Link href="/forum">
              <Button variant="outline" className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Forum
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

