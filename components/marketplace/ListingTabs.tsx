'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, MessageSquare, Star, FileText } from 'lucide-react'
import SellerRatingDisplay from './SellerRatingDisplay'

interface ListingTabsProps {
  description: string
  sellerId: string
  averageRating: number
  totalRatings: number
  ratings: Array<{
    id: string
    rating: number
    comment: string | null
    buyer: {
      username: string
      avatarUrl: string | null
    }
    createdAt: Date | string
  }>
}

export default function ListingTabs({
  description,
  sellerId,
  averageRating,
  totalRatings,
  ratings,
}: ListingTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'ratings' | 'secure' | 'qa'>('description')

  return (
    <div className="mt-6 md:mt-8">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('description')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
            activeTab === 'description'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4 inline mr-1.5" />
          Açıklama
        </button>
        <button
          onClick={() => setActiveTab('ratings')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
            activeTab === 'ratings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className="h-4 w-4 inline mr-1.5" />
          Değerlendirme
        </button>
        <button
          onClick={() => setActiveTab('secure')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
            activeTab === 'secure'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-4 w-4 inline mr-1.5" />
          Güvenli Ticaret
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
            activeTab === 'qa'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-4 w-4 inline mr-1.5" />
          Soru & Cevap
        </button>
      </div>

      {/* Tab Content */}
      <Card className="glass-effect">
        <CardContent className="pt-6">
          {activeTab === 'description' && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed break-words">
                {description}
              </p>
            </div>
          )}

          {activeTab === 'ratings' && (
            <SellerRatingDisplay
              sellerId={sellerId}
              averageRating={averageRating}
              totalRatings={totalRatings}
              ratings={ratings}
            />
          )}

          {activeTab === 'secure' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Güvenli Ticaret Nedir?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Standoff 2 Topluluk platformu, geliştirdiği Güvenli Ticaret Sistemi ile alıcı ve satıcı arasında güven köprüsü oluşturur. Bu sistemin amacı dolandırıcılığın önüne geçmek ve üyelerimizi korumaktır. Aşağıdaki kurallara uyarak kendinizi çok yüksek oranda korumaya alabilirsiniz.
                </p>
              </div>

              <div>
                <h4 className="text-base font-semibold mb-2">Havuz Sistemi ile Güvenli Alışveriş Nasıl Yapılır?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Aşağıda hem alıcı, hem satıcı olarak nasıl güvenli alışveriş yapabileceğiniz yazmaktadır.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-semibold mb-2">Alıcı Olarak Güvenli Alışveriş:</h5>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>Bakiye yükleme aşamasında kart bilgileriniz asla kayıt edilmez, Türkiye'nin en güvenli ödeme sistemleri olan PayTR, Gpay ve Tosla gibi firmalar ile çalışıyoruz.</li>
                    <li>İlanı satın almadan önce mutlaka satıcıya mesaj atıp tüm detayları öğrenin. Anlaşma sonrasında ilan satın al butonuna tıklayınız.</li>
                    <li>Satın alım sonrası satıcıya SMS gönderilir ve ürünü belirttiği teslimat süresi içinde sohbet sayfasından size iletmesi gerekir.</li>
                    <li>Aldığınız ürünü tamamen sahip olmadığınız sürece asla siparişi onaylamayınız. Siparişi onaylarsanız para satıcının hesabına aktarılır.</li>
                    <li>Siparişi bildirimlerim sayfasından onaylayarak parayı satıcıya aktarabilirsiniz. Eğer 24 saat içerisinde hiçbir işlem yapmazsanız işlem sistem tarafından otomatik onaylanır.</li>
                    <li>Bu yüzden eğer sipariş size teslim edilmediyse 24 saat sonra ermeden önce iade talebin bulunun. Kanıtlarınızı videolu olmalıdır.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="text-sm font-semibold mb-2">Satıcı Olarak Güvenli Alışveriş:</h5>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>Alıcınız size chat üzerinden ulaştığında tüm sorularını şeffaf bir şekilde cevaplamalısınız.</li>
                    <li>Alıcınız ürünü satın aldığında size SMS, e-posta ve site içi bildirim gelecektir.</li>
                    <li>Alıcıya ürünü tamamen teslim etmeden önce asla onay istemeyiniz.</li>
                    <li>Teslimat sonrası alıcınızın onay vermesi için 24 saat süresi bulunur.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Henüz soru sorulmamış. İlk soruyu siz sorun!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


