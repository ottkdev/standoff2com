/**
 * Wiki seed data - Example articles for Standoff 2 Wiki
 * 
 * This file contains example wiki articles that demonstrate
 * the content structure and quality expected for the wiki.
 * 
 * Run with: npx tsx prisma/seed-wiki.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding wiki articles...')

  // Get admin user (or create one)
  let admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  })

  if (!admin) {
    admin = await prisma.user.findFirst({
      where: { role: 'MODERATOR' },
    })
  }

  if (!admin) {
    console.log('❌ No admin/moderator user found. Please create one first.')
    return
  }

  const exampleArticles = [
    {
      title: 'AK-47 Rehberi: İstatistikler, Kullanım ve Taktikler',
      slug: 'ak-47-rehberi-istatistikler-kullanim-ve-taktikler',
      excerpt: 'AK-47, Standoff 2\'nin en popüler ve güçlü saldırı tüfeğidir. Bu kapsamlı rehberde AK-47\'nin tüm istatistikleri, hasar değerleri, kullanım ipuçları ve taktiksel önerileri bulacaksınız.',
      category: 'SILAHLAR' as const,
      content: `## Genel Bakış

AK-47, Standoff 2'de en çok tercih edilen saldırı tüfeğidir. Yüksek hasar çıkışı ve güçlü penetrasyon özelliği ile oyuncuların favorisi haline gelmiştir. Bu rehber, AK-47'yi etkili bir şekilde kullanmak için ihtiyacınız olan tüm bilgileri içermektedir.

## İstatistikler

### Temel Özellikler
- **Hasar**: 33 (kafa), 25 (gövde), 19 (bacak)
- **Menzil**: 30 metre (etkili)
- **Rekol**: Yüksek (dikey ve yatay)
- **Atış Hızı**: 600 RPM
- **Mermi Kapasitesi**: 30/90
- **Fiyat**: $2700

### Hasar Analizi
AK-47, kafa vuruşlarında tek atışta öldürme kapasitesine sahiptir. Gövde vuruşlarında ise 4-5 atış ile öldürme yapabilir. Bu özelliği, AK-47'yi close-range ve medium-range savaşlarda çok etkili kılar.

## Kullanım İpuçları

### Rekol Kontrolü
AK-47'nin en büyük zorluğu yüksek rekoldur. Etkili kullanım için:

1. **İlk 3-4 Atış**: Dikey rekol çok yüksektir, crosshair'ı düşük tutun
2. **Orta Mesafe**: Kısa patlamalar halinde atış yapın (3-5 mermi)
3. **Uzun Mesafe**: Tekli veya çiftli atışlar tercih edin

### Taktiksel Öneriler

#### Close-Range Savaşlar
- Tam otomatik modda kullanın
- İlk atışları kafaya yönlendirin
- Düşmanın hareketini takip edin

#### Medium-Range Savaşlar
- 3-5 mermilik patlamalar
- Rekol kontrolü kritik
- Cover kullanımı önemli

#### Long-Range Savaşlar
- Tekli/çiftli atışlar
- AWP veya sniper tercih edilebilir
- Ekonomik değil

## Meta Pozisyonu

AK-47, mevcut meta'da en güçlü saldırı tüfeği konumundadır. Yüksek hasar çıkışı ve kafa vuruşu öldürme kapasitesi nedeniyle competitive oyunlarda sıklıkla tercih edilir.

### Avantajlar
- Yüksek hasar çıkışı
- Kafa vuruşu tek atış öldürme
- Güçlü penetrasyon
- Ekonomik fiyat

### Dezavantajlar
- Yüksek rekol
- Uzun mesafe zorluğu
- Yavaş hareket hızı (scope ile)

## Önerilen Yükseltmeler

1. **Susturucu**: Gizlilik için
2. **Scope**: Uzun mesafe için
3. **Grip**: Rekol kontrolü için

## Pro Oyuncu İpuçları

- İlk atışı her zaman kafaya yönlendirin
- Rekol pattern'ini ezberleyin
- Ekonomi yönetiminde AK-47'yi tercih edin
- Close-range'de M4A1'e göre avantajlıdır

## Sonuç

AK-47, doğru kullanıldığında oyunun en güçlü silahlarından biridir. Rekol kontrolü ve taktiksel kullanım ile competitive seviyede başarılı olabilirsiniz.`,
      metaTitle: 'AK-47 Rehberi - Standoff 2 Silah İstatistikleri ve Kullanım',
      metaDescription: 'AK-47\'nin detaylı istatistikleri, hasar değerleri, rekol kontrolü ve taktiksel kullanım ipuçları. Standoff 2\'nin en güçlü saldırı tüfeği rehberi.',
      keywords: 'ak-47 standoff 2, ak47 rehber, standoff 2 silah istatistikleri, ak-47 hasar, ak-47 rekol kontrolü',
      isPublished: true,
    },
    {
      title: 'Yeni Başlayanlar İçin Kapsamlı Rehber',
      slug: 'yeni-baslayanlar-icin-kapsamli-rehber',
      excerpt: 'Standoff 2\'ye yeni başlayanlar için hazırlanmış kapsamlı başlangıç rehberi. Temel mekanikler, kontroller, oyun modları ve ilk adımlar hakkında her şey.',
      category: 'TAKTIKLER' as const,
      content: `## Hoş Geldiniz

Standoff 2'ye hoş geldiniz! Bu rehber, oyuna yeni başlayanlar için hazırlanmış kapsamlı bir başlangıç kılavuzudur. Temel mekaniklerden gelişmiş taktiklere kadar her şeyi öğreneceksiniz.

## İlk Adımlar

### Oyun Kurulumu
1. Oyunu indirin ve kurun
2. Hesap oluşturun
3. İlk eğitimi tamamlayın
4. Ayarları optimize edin

### Temel Kontroller
- **Hareket**: WASD tuşları
- **Ateş**: Sol tık
- **Nişan**: Sağ tık
- **Yeniden Yükleme**: R tuşu
- **Ekipman**: 1-5 tuşları

## Oyun Modları

### Team Deathmatch
- Hızlı aksiyon
- Ölüm sayısı önemli
- Yeni başlayanlar için ideal

### Defuse
- Stratejik oyun modu
- Bomba yerleştirme/savunma
- Takım çalışması gerekli

### Competitive
- Rütbe sistemi
- Ciddi oyun modu
- İleri seviye oyuncular için

## Temel Taktikler

### Hareket
- Cover kullanın
- Açık alanlardan kaçının
- Düşman pozisyonlarını öğrenin

### Nişan
- Crosshair yerleşimi önemli
- Kafa seviyesinde tutun
- Düşman hareketini takip edin

### Ekonomi
- Para yönetimi kritik
- Silah seçiminde dikkatli olun
- Takım ekonomisine uyun

## Yaygın Hatalar

1. **Açıkta Kalma**: Cover kullanmamak
2. **Ekonomi Yönetimi**: Gereksiz harcama
3. **Takım İletişimi**: Bilgi paylaşmamak
4. **Rekol Kontrolü**: Tam otomatik uzun mesafe

## İlerleme İpuçları

1. Düzenli pratik yapın
2. Pro oyuncuları izleyin
3. Haritaları öğrenin
4. Silah istatistiklerini inceleyin
5. Takım oyunu geliştirin

## Sonraki Adımlar

Temel bilgileri öğrendikten sonra:
- [Silah Rehberleri](/wiki/silahlar)
- [Harita Analizleri](/wiki/haritalar)
- [Gelişmiş Taktikler](/wiki/taktikler)

## Sonuç

Standoff 2, öğrenme eğrisi olan ancak çok eğlenceli bir oyundur. Sabırlı olun, pratik yapın ve topluluktan öğrenin. Başarılar!`,
      metaTitle: 'Standoff 2 Yeni Başlayanlar Rehberi - İlk Adımlar ve Temel Taktikler',
      metaDescription: 'Standoff 2\'ye yeni başlayanlar için kapsamlı rehber. Temel kontroller, oyun modları, taktikler ve ilerleme ipuçları.',
      keywords: 'standoff 2 yeni başlayanlar, standoff 2 rehber, standoff 2 nasıl oynanır, standoff 2 başlangıç',
      isPublished: true,
    },
  ]

  for (const article of exampleArticles) {
    // Check if article already exists
    const existing = await prisma.wikiArticle.findUnique({
      where: { slug: article.slug },
    })

    if (!existing) {
      const toc = generateTOC(article.content)
      
      await prisma.wikiArticle.create({
        data: {
          ...article,
          authorId: admin.id,
          tableOfContents: JSON.stringify(toc),
          publishedAt: new Date(),
        },
      })
      console.log(`✅ Created: ${article.title}`)
    } else {
      console.log(`⏭️  Skipped (exists): ${article.title}`)
    }
  }

  console.log('✨ Wiki seeding completed!')
}

function generateTOC(content: string): Array<{ id: string; text: string; level: number }> {
  const toc: Array<{ id: string; text: string; level: number }> = []
  const lines = content.split('\n')

  for (const line of lines) {
    if (line.startsWith('## ')) {
      const text = line.replace('## ', '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      toc.push({ id, text, level: 2 })
    } else if (line.startsWith('### ')) {
      const text = line.replace('### ', '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      toc.push({ id, text, level: 3 })
    }
  }

  return toc
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

