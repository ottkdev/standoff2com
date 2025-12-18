'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPage() {
  const [updateDate, setUpdateDate] = useState<string | null>(null)

  useEffect(() => {
    setUpdateDate(new Date().toLocaleDateString('tr-TR'))
  }, [])

  return (
    <div className="container py-10 max-w-4xl">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-3xl">Gizlilik Politikası</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none">
          <h2>1. Veri Toplama</h2>
          <p>
            Platform, kullanıcı kaydı sırasında e-posta, kullanıcı adı ve şifre bilgilerini toplar.
            Profil bilgileri (görünen ad, biyografi, profil fotoğrafı) isteğe bağlıdır.
          </p>

          <h2>2. Veri Kullanımı</h2>
          <p>
            Toplanan veriler platform hizmetlerini sağlamak, kullanıcı deneyimini iyileştirmek 
            ve güvenliği sağlamak amacıyla kullanılır.
          </p>

          <h2>3. Veri Paylaşımı</h2>
          <p>
            Kullanıcı verileri üçüncü taraflarla paylaşılmaz. Yalnızca yasal zorunluluklar 
            durumunda yetkili makamlarla paylaşılabilir.
          </p>

          <h2>4. Çerezler</h2>
          <p>
            Platform, oturum yönetimi ve kullanıcı deneyimi için çerezler kullanır.
          </p>

          <h2>5. Veri Güvenliği</h2>
          <p>
            Kullanıcı verileri şifrelenmiş olarak saklanır ve güvenlik önlemleri alınır.
          </p>

          <h2>6. Haklarınız</h2>
          <p>
            Kullanıcılar verilerine erişme, düzeltme ve silme hakkına sahiptir.
          </p>

          <p className="text-sm text-muted-foreground mt-8">
            Son güncelleme: {updateDate ?? 'Yükleniyor...'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
