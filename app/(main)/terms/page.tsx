import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Static date for terms page - prevents hydration mismatch
 * Update this date when terms are actually updated
 */
const TERMS_UPDATE_DATE = '2024-01-15'

export default function TermsPage() {
  // Use static date to prevent hydration mismatch
  // Server and client will render the same value
  const updateDate = new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(TERMS_UPDATE_DATE))

  return (
    <div className="container py-10 max-w-4xl">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-3xl">Kullanım Şartları</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none">
          <h2>1. Genel Hükümler</h2>
          <p>
            Standoff 2 Topluluk platformunu kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.
          </p>

          <h2>2. Kullanıcı Sorumlulukları</h2>
          <p>
            Kullanıcılar platformu yasalara uygun şekilde kullanmakla yükümlüdür. 
            Spam, nefret söylemi, yasadışı içerik paylaşımı yasaktır.
          </p>

          <h2>3. İçerik Politikası</h2>
          <p>
            Paylaşılan içeriklerden kullanıcılar sorumludur. Telif hakkı ihlali yapan içerikler kaldırılır.
          </p>

          <h2>4. Hesap Güvenliği</h2>
          <p>
            Kullanıcılar hesap bilgilerini güvende tutmakla yükümlüdür. 
            Hesap güvenliği ihlallerinden platform sorumlu değildir.
          </p>

          <h2>5. Değişiklikler</h2>
          <p>
            Bu şartlar zaman zaman güncellenebilir. Güncellemeler platform üzerinden duyurulur.
          </p>

          <p className="text-sm text-muted-foreground mt-8">
            Son güncelleme: {updateDate}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
