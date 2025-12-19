import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.supportMessage.deleteMany()
  await prisma.supportTicket.deleteMany()
  await prisma.wikiLike.deleteMany()
  await prisma.wikiComment.deleteMany()
  await prisma.wikiArticle.deleteMany()
  await prisma.blogLike.deleteMany()
  await prisma.blogComment.deleteMany()
  await prisma.blogPost.deleteMany()
  await prisma.commentLike.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.postLike.deleteMany()
  await prisma.postImage.deleteMany()
  await prisma.post.deleteMany()
  await prisma.marketplaceImage.deleteMany()
  await prisma.marketplaceListing.deleteMany()
  await prisma.message.deleteMany()
  await prisma.userBadge.deleteMany()
  await prisma.badge.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()
  await prisma.category.deleteMany()

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Generate fake usernames
  const fakeUsernames = [
    'standoff_master', 'pro_gamer_tr', 'ak47_legend', 'sniper_king', 'team_player',
    'ranked_warrior', 'map_explorer', 'skin_collector', 'tactical_mind', 'aim_god',
    'defuse_pro', 'deathmatch_champ', 'arms_race_winner', 'competitive_pro', 'casual_player',
    'newbie_helper', 'strategy_guru', 'weapon_expert', 'map_strategist', 'tournament_winner',
    'community_leader', 'content_creator_so2', 'streamer_pro', 'youtuber_standoff', 'twitch_gamer',
    'discord_mod', 'forum_admin', 'wiki_editor', 'guide_writer', 'tutorial_maker',
    'skin_trader', 'account_seller', 'marketplace_pro', 'trusted_seller', 'verified_trader',
    'beginner_friendly', 'helpful_player', 'experienced_gamer', 'veteran_player', 'elite_ranked'
  ]

  // Create Users (6 original + 35 fake = 41 total)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@standoff2.com',
        password: hashedPassword,
        displayName: 'Admin',
        role: 'ADMIN',
        isVerified: true,
        bio: 'Standoff 2 Topluluk Yöneticisi',
      },
    }),
    prisma.user.create({
      data: {
        username: 'moderator',
        email: 'mod@standoff2.com',
        password: hashedPassword,
        displayName: 'Moderator',
        role: 'MODERATOR',
        isVerified: true,
        bio: 'Forum Moderatorü',
      },
    }),
    prisma.user.create({
      data: {
        username: 'proplayer',
        email: 'pro@standoff2.com',
        password: hashedPassword,
        displayName: 'Pro Player',
        isVerified: true,
        bio: 'Profesyonel Standoff 2 oyuncusu',
        postCount: 15,
        commentCount: 45,
      },
    }),
    prisma.user.create({
      data: {
        username: 'newbie',
        email: 'newbie@standoff2.com',
        password: hashedPassword,
        displayName: 'Yeni Oyuncu',
        bio: 'Yeni başlayan oyuncu, yardıma ihtiyacım var!',
        postCount: 3,
        commentCount: 12,
      },
    }),
    prisma.user.create({
      data: {
        username: 'trader',
        email: 'trader@standoff2.com',
        password: hashedPassword,
        displayName: 'Tüccar',
        bio: 'Güvenilir alım-satım yapıyorum',
        postCount: 8,
        commentCount: 25,
      },
    }),
    prisma.user.create({
      data: {
        username: 'content_creator',
        email: 'creator@standoff2.com',
        password: hashedPassword,
        displayName: 'İçerik Üreticisi',
        isVerified: true,
        bio: 'Standoff 2 içerikleri üretiyorum',
        postCount: 20,
        commentCount: 60,
      },
    }),
    // Create 35 fake users
    ...fakeUsernames.map((username, index) => 
      prisma.user.create({
        data: {
          username,
          email: `${username}@standoff2.com`,
          password: hashedPassword,
          displayName: username.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          isVerified: Math.random() > 0.7,
          bio: index % 3 === 0 ? 'Aktif Standoff 2 oyuncusu' : index % 3 === 1 ? 'Yeni başlayan, öğreniyorum' : 'Deneyimli oyuncu',
          postCount: Math.floor(Math.random() * 30),
          commentCount: Math.floor(Math.random() * 100),
        },
      })
    ),
  ])

  console.log(`✅ Created ${users.length} users`)

  // Create Badges
  const badges = await Promise.all([
    prisma.badge.create({
      data: {
        name: 'Aktif Üye',
        description: '100+ yorum yapan üye',
        color: '#10B981',
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Topluluk Lideri',
        description: '50+ konu açan üye',
        color: '#8B5CF6',
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Güvenilir Satıcı',
        description: '10+ başarılı satış',
        color: '#F59E0B',
      },
    }),
    prisma.badge.create({
      data: {
        name: 'Yardımsever',
        description: 'Yeni oyunculara yardım eden',
        color: '#3B82F6',
      },
    }),
  ])

  // Assign badges
  await prisma.userBadge.createMany({
    data: [
      { userId: users[2].id, badgeId: badges[0].id },
      { userId: users[2].id, badgeId: badges[1].id },
      { userId: users[4].id, badgeId: badges[2].id },
      { userId: users[3].id, badgeId: badges[3].id },
    ],
  })

  console.log('✅ Created badges')

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Genel Tartışma',
        slug: 'genel-tartisma',
        description: 'Standoff 2 ile ilgili genel konular',
        order: 0,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Yardım & Destek',
        slug: 'yardim-destek',
        description: 'Yardım isteyin, sorularınızı sorun',
        order: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Strateji & Rehberler',
        slug: 'strateji-rehberler',
        description: 'Oyun stratejileri ve rehberler',
        order: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Ekipman & Ayarlar',
        slug: 'ekipman-ayarlar',
        description: 'Kontroller, ayarlar ve ekipman önerileri',
        order: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Turnuvalar & Etkinlikler',
        slug: 'turnuvalar-etkinlikler',
        description: 'Turnuvalar ve topluluk etkinlikleri',
        order: 4,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Haberler',
        slug: 'haberler',
        description: 'Oyun haberleri ve duyurular',
        order: 0,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Rehberler',
        slug: 'rehberler',
        description: 'Oyun rehberleri ve ipuçları',
        order: 1,
      },
    }),
  ])

  console.log('✅ Created categories')

  // Create Forum Posts
  const forumPosts = []
  const postTitles = [
    'Yeni güncelleme hakkında ne düşünüyorsunuz?',
    'En iyi silah kombinasyonu nedir?',
    'Ranked modda nasıl daha iyi oynarım?',
    'Yeni başlayanlar için ipuçları',
    'Kontrolleri nasıl optimize ederim?',
    'En iyi harita stratejileri',
    'Takım oyunu nasıl oynanır?',
    'Para kazanma rehberi',
    'Skin önerileri',
    'Turnuva takımı arıyorum',
    'Hesap güvenliği nasıl sağlanır?',
    'Yeni silah denemeleri',
    'Aim geliştirme teknikleri',
    'Komunikasyon önemli mi?',
    'En iyi ekipman önerileri',
  ]

  for (let i = 0; i < postTitles.length; i++) {
    const category = categories[i % 5] // Forum categories (0-4)
    const author = users[Math.floor(Math.random() * users.length)]
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30))

    const post = await prisma.post.create({
      data: {
        title: postTitles[i],
        content: `Bu konu hakkında görüşlerinizi paylaşın. ${i % 3 === 0 ? 'Detaylı bir açıklama yapmak istiyorum.' : ''} Topluluğun fikirlerini merak ediyorum.`,
        slug: `post-${i}-${Date.now()}`,
        authorId: author.id,
        categoryId: category.id,
        viewCount: Math.floor(Math.random() * 500) + 10,
        likeCount: Math.floor(Math.random() * 50),
        commentCount: Math.floor(Math.random() * 20),
        isPinned: i < 2,
        createdAt,
      },
    })
    forumPosts.push(post)
  }

  console.log('✅ Created forum posts')

  // Create Comments
  for (const post of forumPosts.slice(0, 10)) {
    const commentCount = Math.floor(Math.random() * 5) + 1
    for (let i = 0; i < commentCount; i++) {
      const author = users[Math.floor(Math.random() * users.length)]
      await prisma.comment.create({
        data: {
          content: `Harika bir konu! ${i === 0 ? 'Kesinlikle katılıyorum.' : 'Bence de öyle.'}`,
          postId: post.id,
          authorId: author.id,
          likeCount: Math.floor(Math.random() * 10),
          createdAt: new Date(post.createdAt.getTime() + i * 3600000),
        },
      })
    }
  }

  console.log('✅ Created comments')

  // Create Blog Posts
  const blogPosts = []
  const blogTitles = [
    {
      title: 'Standoff 2 Yeni Güncelleme: Yeni Haritalar ve Silahlar',
      excerpt: 'Yeni güncelleme ile gelen haritalar ve silahlar hakkında detaylı bilgi.',
      category: categories[5].id, // Haberler
    },
    {
      title: 'Ranked Mod Rehberi: Nasıl Yükselirsiniz?',
      excerpt: 'Ranked modda başarılı olmak için ipuçları ve stratejiler.',
      category: categories[6].id, // Rehberler
    },
    {
      title: 'Yeni Oyuncular İçin Başlangıç Rehberi',
      excerpt: 'Standoff 2\'ye yeni başlayanlar için kapsamlı rehber.',
      category: categories[6].id,
    },
    {
      title: 'En İyi Silah Kombinasyonları 2024',
      excerpt: '2024 yılında en etkili silah kombinasyonları ve kullanım ipuçları.',
      category: categories[6].id,
    },
    {
      title: 'Turnuva Duyurusu: Bahar Kupası',
      excerpt: 'Bahar Kupası turnuvası başlıyor! Kayıtlar açıldı.',
      category: categories[5].id,
    },
  ]

  for (let i = 0; i < blogTitles.length; i++) {
    const blog = blogTitles[i]
    const author = users[0] // Admin
    const publishedAt = new Date()
    publishedAt.setDate(publishedAt.getDate() - (blogTitles.length - i))

    const blogPost = await prisma.blogPost.create({
      data: {
        title: blog.title,
        content: `${blog.excerpt}\n\nBu yazıda detaylı bilgiler bulacaksınız. Standoff 2 topluluğu için hazırlanmış bu içerik, oyunculara yardımcı olmayı amaçlamaktadır.\n\nDaha fazla bilgi için forum sayfamızı ziyaret edebilirsiniz.`,
        excerpt: blog.excerpt,
        slug: `blog-${i}-${Date.now()}`,
        authorId: author.id,
        categoryId: blog.category,
        isPublished: true,
        publishedAt,
        viewCount: Math.floor(Math.random() * 1000) + 50,
        likeCount: Math.floor(Math.random() * 100),
        commentCount: Math.floor(Math.random() * 30),
      },
    })
    blogPosts.push(blogPost)
  }

  console.log('✅ Created blog posts')

  // Create Marketplace Listings
  const listings = []
  const listingTitles = [
    'Premium Hesap - Tüm Silahlar Açık',
    'Rare Skin Koleksiyonu',
    'Ranked Hesap - Global Elite',
    'Yeni Başlayanlar İçin Hesap',
    'Sınırlı Skin Paketi',
    'Pro Oyuncu Hesabı',
  ]

  for (let i = 0; i < listingTitles.length; i++) {
    const seller = users[4] // trader
    const status = i < 4 ? 'ACTIVE' : 'PENDING'
    const price = (Math.random() * 500 + 50).toFixed(2)

    const listing = await prisma.marketplaceListing.create({
      data: {
        title: listingTitles[i],
        description: `${listingTitles[i]} - Güvenilir satıcıdan kaliteli hesap. Detaylı bilgi için mesaj atabilirsiniz.`,
        price: parseFloat(price),
        status,
        sellerId: seller.id,
        approvedById: status === 'ACTIVE' ? users[0].id : null,
        createdAt: new Date(Date.now() - i * 86400000),
      },
    })
    listings.push(listing)
  }

  console.log('✅ Created marketplace listings')

  // Create Follows
  await prisma.follow.createMany({
    data: [
      { followerId: users[2].id, followingId: users[0].id },
      { followerId: users[3].id, followingId: users[2].id },
      { followerId: users[4].id, followingId: users[2].id },
      { followerId: users[5].id, followingId: users[0].id },
    ],
  })

  console.log('✅ Created follows')

  // Create Wiki Articles
  const wikiArticles = []
  const wikiContent = [
    {
      title: 'AKR - Saldırı Tüfeği Rehberi',
      slug: 'akr-saldiri-tufegi-rehberi',
      category: 'SILAHLAR',
      excerpt: 'AKR, Standoff 2\'de en popüler saldırı tüfeklerinden biridir. Yüksek hasar ve zırh delme gücü ile bilinir.',
      content: `# AKR - Saldırı Tüfeği Rehberi

## Genel Bilgiler

AKR, Standoff 2'de en popüler ve güçlü saldırı tüfeklerinden biridir. Yüksek hasar değeri ve zırh delme gücü ile oyuncular arasında tercih edilen bir silahtır.

## İstatistikler

- **Hasar:** 33 (kafa), 25 (gövde), 19 (bacak)
- **Zırh Delme:** %75
- **Atış Hızı:** 600 RPM
- **Menzil:** Orta-Uzun
- **Geri Tepme:** Orta-Yüksek

## Kullanım İpuçları

1. **Kısa Mesafe:** AKR, yakın mesafede çok etkilidir. İlk atışlarınızı kafaya yönlendirin.

2. **Orta Mesafe:** Burst fire (kısa seriler) kullanarak geri tepmeyi kontrol edin.

3. **Uzun Mesafe:** Tek tek atış yaparak hassasiyeti artırın.

## En İyi Kullanım Senaryoları

- Defuse modunda bomba alanlarını korurken
- Takım ölüm maçında agresif oyun tarzı
- Ranked modda ekonomik durum iyi olduğunda

## Dezavantajları

- Yüksek geri tepme
- Pahalı (maliyet: $2700)
- Yavaş hareket hızı`,
    },
    {
      title: 'M4A1 - Çok Yönlü Saldırı Tüfeği',
      slug: 'm4a1-cok-yonlu-saldiri-tufegi',
      category: 'SILAHLAR',
      excerpt: 'M4A1, dengeli istatistikleri ile hem yeni hem de deneyimli oyuncular için ideal bir seçimdir.',
      content: `# M4A1 - Çok Yönlü Saldırı Tüfeği

## Genel Bilgiler

M4A1, AKR'ye göre daha düşük hasar verir ancak daha iyi kontrol edilebilir geri tepme ve daha yüksek atış hızına sahiptir.

## İstatistikler

- **Hasar:** 31 (kafa), 23 (gövde), 17 (bacak)
- **Zırh Delme:** %70
- **Atış Hızı:** 666 RPM
- **Menzil:** Orta
- **Geri Tepme:** Düşük-Orta

## Kullanım İpuçları

1. **Kontrollü Ateş:** M4A1'in geri tepmesi daha kolay kontrol edilir, uzun seriler atabilirsiniz.

2. **Hareketli Hedefler:** Yüksek atış hızı sayesinde hareketli hedefleri vurmak daha kolaydır.

3. **Ekonomik Seçim:** AKR'den daha ucuz olması nedeniyle ekonomik durum kötüyse tercih edilebilir.

## En İyi Kullanım Senaryoları

- Yeni başlayan oyuncular için ideal
- Orta mesafe çatışmalarında
- Ekonomik durum sınırlı olduğunda`,
    },
    {
      title: 'AWM - Keskin Nişancı Tüfeği',
      slug: 'awm-keskin-nisanci-tufegi',
      category: 'SILAHLAR',
      excerpt: 'AWM, tek atışta öldürme gücüne sahip en güçlü keskin nişancı tüfeğidir.',
      content: `# AWM - Keskin Nişancı Tüfeği

## Genel Bilgiler

AWM, Standoff 2'de en güçlü keskin nişancı tüfeğidir. Kafaya isabet eden tek atış öldürür, gövdeye isabet eden atışlar da genellikle öldürücüdür.

## İstatistikler

- **Hasar:** 115 (kafa), 88 (gövde), 65 (bacak)
- **Zırh Delme:** %95
- **Atış Hızı:** 41 RPM
- **Menzil:** Çok Uzun
- **Geri Tepme:** Çok Yüksek

## Kullanım İpuçları

1. **Sabır:** AWM kullanırken sabırlı olun, her atışınız değerlidir.

2. **Pozisyon:** Yüksek ve korunaklı pozisyonlar seçin.

3. **Aim:** Kafaya nişan almayı öğrenin, tek atış yeterli olacaktır.

## En İyi Kullanım Senaryoları

- Defuse modunda uzun mesafe koruma
- Ranked modda ekonomik avantaj sağlandığında
- Takım stratejilerinde sniper rolü`,
    },
    {
      title: 'Sandstone Haritası Strateji Rehberi',
      slug: 'sandstone-haritasi-strateji-rehberi',
      category: 'HARITALAR',
      excerpt: 'Sandstone, dar sokakları ve açık alanlarıyla taktiksel oyun imkânı sunan popüler bir haritadır.',
      content: `# Sandstone Haritası Strateji Rehberi

## Harita Genel Bakış

Sandstone, Standoff 2'nin en popüler haritalarından biridir. Dar sokaklar, açık alanlar ve çok katlı binalar içerir.

## Önemli Bölgeler

### Bomba Alanları
- **A Noktası:** Merkezi konum, hızlı erişim
- **B Noktası:** Daha korunaklı, uzun mesafe çatışmalar için ideal

### Stratejik Pozisyonlar
1. **Mid:** Haritanın ortası, her iki bomba alanına erişim sağlar
2. **Long:** Uzun mesafe çatışmalar için ideal
3. **Short:** Yakın mesafe çatışmalar için dar geçit

## Terörist Stratejileri

1. **Rush A:** Hızlı A noktası saldırısı
2. **Split B:** B noktasına iki yönlü saldırı
3. **Fake:** Bir noktaya fake saldırı, diğerine gerçek saldırı

## Anti-Terörist Stratejileri

1. **Defensive Setup:** Her iki noktayı da koruma
2. **Aggressive Defense:** Mid kontrolü ile agresif savunma
3. **Retake:** Bomba kurulduktan sonra geri alma stratejisi`,
    },
    {
      title: 'Province Haritası Rehberi',
      slug: 'province-haritasi-rehberi',
      category: 'HARITALAR',
      excerpt: 'Province, farklı yükseklik seviyeleri ve geniş alanlarıyla dikkat çeken taktiksel bir haritadır.',
      content: `# Province Haritası Rehberi

## Harita Genel Bakış

Province, çok katlı yapıları ve geniş açık alanları ile bilinir. Hem yakın mesafe hem de uzun mesafe çatışmalar için uygundur.

## Önemli Bölgeler

### Bomba Alanları
- **A Site:** Üst kat, dar girişler
- **B Site:** Alt kat, geniş alan

### Stratejik Pozisyonlar
1. **Catwalk:** Üst geçit, harita kontrolü
2. **Tunnels:** Alt geçitler, gizli hareket
3. **Mid:** Merkezi kontrol noktası

## Taktikler

- **Vertical Gameplay:** Çok katlı yapı avantajı
- **Smoke Usage:** Açık alanları kapatma
- **Flash Coordination:** Takım koordinasyonu`,
    },
    {
      title: 'Defuse Modu - Bomba Kurma Rehberi',
      slug: 'defuse-modu-bomba-kurma-rehberi',
      category: 'OYUN_MODLARI',
      excerpt: 'Defuse modu, Standoff 2\'nin en stratejik oyun modudur. Teröristler bomba kurar, Anti-Teröristler engeller.',
      content: `# Defuse Modu - Bomba Kurma Rehberi

## Mod Genel Bakış

Defuse modu, iki takım arasında oynanan klasik bomba kurma modudur. Teröristler bomba kurmaya çalışır, Anti-Teröristler engellemeye çalışır.

## Terörist Tarafı

### Amaç
Bombayı belirlenen noktalardan birine kurmak ve patlamasını sağlamak.

### Stratejiler
1. **Rush:** Hızlı saldırı ile bomba alanını ele geçirme
2. **Default:** Standart pozisyonlar ve takım koordinasyonu
3. **Fake:** Sahte saldırı ile düşmanı yanıltma

## Anti-Terörist Tarafı

### Amaç
Bombayı kurmayı engellemek veya kurulmuş bombayı etkisiz hale getirmek.

### Stratejiler
1. **Defensive Setup:** Her noktayı koruma
2. **Aggressive Defense:** Mid kontrolü ile agresif savunma
3. **Retake:** Bomba kurulduktan sonra geri alma

## Ekonomi Yönetimi

- İlk round: Pistol ve ekipman
- Kazanılan round: Tam ekipman
- Kaybedilen round: Save veya force buy`,
    },
    {
      title: 'Team Deathmatch Modu',
      slug: 'team-deathmatch-modu',
      category: 'OYUN_MODLARI',
      excerpt: 'Team Deathmatch, hızlı tempolu çatışmalar için ideal bir moddur. En fazla öldürmeyi yapan takım kazanır.',
      content: `# Team Deathmatch Modu

## Mod Genel Bakış

Team Deathmatch (TDM), iki takımın belirli bir süre içinde en fazla öldürmeyi gerçekleştirmeye çalıştığı moddur.

## Oyun Kuralları

- **Süre:** Genellikle 10 dakika
- **Hedef:** İlk 100 öldürmeye ulaşan takım kazanır
- **Respawn:** Öldükten sonra hemen yeniden doğma
- **Sınırsız Cephane:** Cephane sınırı yok

## Stratejiler

1. **Map Control:** Harita kontrolü sağlama
2. **Team Coordination:** Takım koordinasyonu
3. **Weapon Choice:** Moda uygun silah seçimi

## İpuçları

- Hızlı hareket edin
- Takım arkadaşlarınızla birlikte hareket edin
- Harita bilgisini kullanın`,
    },
    {
      title: 'Ranked Mod - Rütbe Sistemi',
      slug: 'ranked-mod-rutbe-sistemi',
      category: 'RUTBELER',
      excerpt: 'Ranked mod, oyuncuların yeteneklerine göre sıralandığı rekabetçi oyun modudur.',
      content: `# Ranked Mod - Rütbe Sistemi

## Rütbe Seviyeleri

Standoff 2'de rütbe sistemi aşağıdan yukarıya doğru şu şekildedir:

1. **Bronze I, II, III**
2. **Silver I, II, III**
3. **Gold I, II, III**
4. **Platinum I, II, III**
5. **Diamond I, II, III**
6. **Master**
7. **Global Elite**

## Rütbe Yükseltme

- **Kazanma:** Rütbe puanı kazanırsınız
- **Kaybetme:** Rütbe puanı kaybedersiniz
- **Performans:** Bireysel performansınız da etkilidir

## İpuçları

1. **Takım Oyunu:** Takım koordinasyonu çok önemlidir
2. **Ekonomi:** Ekonomi yönetimini öğrenin
3. **Harita Bilgisi:** Haritaları iyi öğrenin
4. **Aim Practice:** Nişan alma pratiği yapın`,
    },
    {
      title: 'Yeni Güncelleme 2024 - Patch Notları',
      slug: 'yeni-guncelleme-2024-patch-notlari',
      category: 'GUNCELLEMELER',
      excerpt: '2024 yılının ilk büyük güncellemesi yayınlandı. Yeni silahlar, haritalar ve dengeler geliyor.',
      content: `# Yeni Güncelleme 2024 - Patch Notları

## Yeni Özellikler

### Yeni Silahlar
- **M4A4:** Yeni saldırı tüfeği eklendi
- **USP-S:** Yeni tabanca eklendi

### Yeni Haritalar
- **Mirage:** Klasik harita geri döndü
- **Dust2:** Yeniden tasarlandı

## Denge Değişiklikleri

### Silah Düzenlemeleri
- AKR hasarı %5 azaltıldı
- M4A1 atış hızı artırıldı
- AWM fiyatı artırıldı

### Harita Düzenlemeleri
- Sandstone'da yeni pozisyonlar eklendi
- Province'da bomba alanları güncellendi

## Bug Düzeltmeleri

- Çeşitli bug'lar düzeltildi
- Performans iyileştirmeleri yapıldı`,
    },
    {
      title: 'Skin Sistemi ve Nadirlik Seviyeleri',
      slug: 'skin-sistemi-nadirlik-seviyeleri',
      category: 'SKINLER',
      excerpt: 'Standoff 2\'de skinler farklı nadirlik seviyelerine sahiptir. Her seviyenin kendine özgü özellikleri vardır.',
      content: `# Skin Sistemi ve Nadirlik Seviyeleri

## Nadirlik Seviyeleri

1. **Common (Beyaz):** En yaygın skinler
2. **Uncommon (Açık Yeşil):** Biraz daha nadir
3. **Rare (Mavi):** Nadir skinler
4. **Epic (Mor):** Çok nadir skinler
5. **Legendary (Turuncu):** Efsanevi skinler
6. **Mythical (Kırmızı):** En nadir skinler

## Skin Değer Faktörleri

- **Nadirlik:** Ne kadar nadir olduğu
- **Durum:** Skin durumu (Factory New, Field-Tested, vb.)
- **StatTrak:** İstatistik takibi olup olmadığı
- **Sticker:** Üzerindeki çıkartmalar

## Skin Ticareti

- Güvenilir platformlar kullanın
- Fiyat araştırması yapın
- Sahte satıcılara dikkat edin`,
    },
    {
      title: 'Ekonomi Sistemi ve Para Yönetimi',
      slug: 'ekonomi-sistemi-para-yonetimi',
      category: 'EKONOMI',
      excerpt: 'Standoff 2\'de ekonomi yönetimi başarı için kritik öneme sahiptir. Doğru para yönetimi ile avantaj sağlayın.',
      content: `# Ekonomi Sistemi ve Para Yönetimi

## Para Kazanma Yolları

1. **Round Kazanma:** Round kazandığınızda para kazanırsınız
2. **Öldürme:** Her öldürme için para
3. **Bomba Kurma:** Bomba kurma bonusu
4. **Bomba Söndürme:** Bomba söndürme bonusu

## Para Harcama Stratejileri

### Full Buy
- Tüm ekipmanı alın
- En iyi silahları seçin
- Ekonomi iyi olduğunda

### Force Buy
- Zorunlu satın alma
- Ekonomi kötü ama round önemli
- Riskli strateji

### Save Round
- Para biriktirme
- Sadece pistol alın
- Sonraki round için hazırlık

## Ekonomi Yönetimi İpuçları

1. Takım koordinasyonu
2. Round önemini değerlendirin
3. Düşman ekonomisini takip edin`,
    },
    {
      title: 'Aim Geliştirme Teknikleri',
      slug: 'aim-gelistirme-teknikleri',
      category: 'TAKTIKLER',
      excerpt: 'İyi bir aim, Standoff 2\'de başarı için kritik öneme sahiptir. Bu rehber ile aim\'inizi geliştirin.',
      content: `# Aim Geliştirme Teknikleri

## Temel Aim Prensipleri

### Crosshair Placement
- Her zaman kafa seviyesinde nişan alın
- Köşelerden çıkarken hazır olun
- Beklenmedik yerlerde düşman olabilir

### Flick Shots
- Hızlı hedef değiştirme
- Mouse hassasiyeti önemli
- Pratik yapın

### Tracking
- Hareketli hedefleri takip etme
- Smooth mouse hareketleri
- Öngörü yeteneği

## Pratik Yöntemleri

1. **Aim Training Maps:** Özel haritalarda pratik
2. **Deathmatch:** Sürekli çatışma pratiği
3. **Bot Practice:** Botlarla pratik yapma

## Mouse Ayarları

- **DPI:** Kişisel tercih (400-1600 arası)
- **Sensitivity:** Düşük hassasiyet genelde daha iyi
- **Raw Input:** Açık tutun`,
    },
    {
      title: 'Yeni Başlayanlar İçin SSS',
      slug: 'yeni-baslayanlar-icin-sss',
      category: 'SSS',
      excerpt: 'Standoff 2\'ye yeni başlayanlar için sık sorulan sorular ve cevapları.',
      content: `# Yeni Başlayanlar İçin SSS

## Genel Sorular

### Oyun Ücretsiz mi?
Evet, Standoff 2 tamamen ücretsizdir. İçerik satın alımları isteğe bağlıdır.

### Hangi Platformlarda Oynanabilir?
- Android
- iOS
- HarmonyOS

### Minimum Sistem Gereksinimleri Nelerdir?
- Android 5.0 veya üzeri
- 2GB RAM
- 1GB boş alan

## Oyun İçi Sorular

### En İyi Silah Hangisi?
Her silahın kendine özgü avantajları vardır. Yeni başlayanlar için M4A1 önerilir.

### Rütbe Nasıl Yükselir?
Ranked modda kazanarak ve iyi performans göstererek rütbe yükseltebilirsiniz.

### Skin Nasıl Alınır?
Skinler oyun içi kasa açma veya ticaret yoluyla elde edilebilir.`,
    },
  ]

  for (const wiki of wikiContent) {
    const author = users[Math.floor(Math.random() * Math.min(10, users.length))]
    const publishedAt = new Date()
    publishedAt.setDate(publishedAt.getDate() - Math.floor(Math.random() * 60))

    const article = await prisma.wikiArticle.create({
      data: {
        title: wiki.title,
        slug: wiki.slug,
        content: wiki.content,
        excerpt: wiki.excerpt,
        category: wiki.category as any,
        authorId: author.id,
        isPublished: true,
        publishedAt,
        viewCount: Math.floor(Math.random() * 5000) + 100,
        likeCount: Math.floor(Math.random() * 200) + 10,
        commentCount: Math.floor(Math.random() * 50),
        metaTitle: wiki.title,
        metaDescription: wiki.excerpt,
        keywords: `${wiki.title}, standoff 2, ${wiki.category.toLowerCase()}`,
      },
    })
    wikiArticles.push(article)
  }

  console.log(`✅ Created ${wikiArticles.length} wiki articles`)

  // Create more Forum Posts (50+ posts)
  const morePostTitles = [
    'AKR vs M4A1 hangisi daha iyi?',
    'Ranked modda takım bulmak zor',
    'Yeni harita çok güzel olmuş',
    'Aim nasıl geliştirilir?',
    'En iyi kontrol ayarları nedir?',
    'Skin ticareti güvenli mi?',
    'Turnuva takımı arıyorum',
    'Yeni güncelleme hakkında görüşler',
    'Hangi silah kombinasyonu en iyi?',
    'Defuse modunda strateji önerileri',
    'Team Deathmatch rekoru kırdım!',
    'Arms Race modu çok eğlenceli',
    'Yeni başlayanlar için öneriler',
    'Pro oyuncuların kullandığı ayarlar',
    'Harita stratejileri paylaşalım',
    'Ekonomi yönetimi nasıl yapılır?',
    'Bomba kurma teknikleri',
    'Retake stratejileri',
    'Smoke kullanımı rehberi',
    'Flash koordinasyonu',
    'Takım iletişimi nasıl olmalı?',
    'Ranked modda yükselme tüyoları',
    'Skin koleksiyonum büyüyor',
    'Turnuva deneyimlerim',
    'Yeni silah denemeleri',
    'Harita öğrenme yöntemleri',
    'Aim training rutinim',
    'Oyun içi ekonomi stratejisi',
    'Takım kurma rehberi',
    'Competitive oyun ipuçları',
    'Yeni güncelleme beklentileri',
    'Topluluk etkinlikleri',
    'Rehber yazma deneyimim',
    'Wiki katkılarım',
    'Forum kuralları hakkında',
    'Moderatör olmak istiyorum',
    'Topluluk önerileri',
    'Site iyileştirme fikirleri',
    'Yeni özellik istekleri',
    'Bug raporları',
  ]

  for (let i = 0; i < morePostTitles.length; i++) {
    const category = categories[i % 5]
    const author = users[Math.floor(Math.random() * users.length)]
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 90))

    const post = await prisma.post.create({
      data: {
        title: morePostTitles[i],
        content: `${morePostTitles[i]} hakkında düşüncelerimi paylaşmak istiyorum. Topluluğun görüşlerini merak ediyorum. Deneyimlerinizi paylaşırsanız sevinirim.`,
        slug: `post-${i + postTitles.length}-${Date.now()}`,
        authorId: author.id,
        categoryId: category.id,
        viewCount: Math.floor(Math.random() * 1000) + 20,
        likeCount: Math.floor(Math.random() * 100),
        commentCount: Math.floor(Math.random() * 30),
        isPinned: false,
        createdAt,
      },
    })
    forumPosts.push(post)
  }

  console.log(`✅ Created ${forumPosts.length} total forum posts`)

  // Create more Comments for all posts
  for (const post of forumPosts) {
    const commentCount = Math.floor(Math.random() * 8) + 2
    for (let i = 0; i < commentCount; i++) {
      const author = users[Math.floor(Math.random() * users.length)]
      const commentTexts = [
        'Kesinlikle katılıyorum!',
        'Harika bir konu, teşekkürler.',
        'Bence de öyle, deneyimlerim de aynı yönde.',
        'Farklı bir bakış açısı, ilginç.',
        'Yeni başlayanlar için çok faydalı olacak.',
        'Pro oyuncuların görüşlerini de merak ediyorum.',
        'Bu konuda daha fazla bilgi paylaşabilir misiniz?',
        'Teşekkürler, çok yardımcı oldu.',
      ]
      await prisma.comment.create({
        data: {
          content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          postId: post.id,
          authorId: author.id,
          likeCount: Math.floor(Math.random() * 15),
          createdAt: new Date(post.createdAt.getTime() + i * 3600000 + Math.random() * 3600000),
        },
      })
    }
  }

  console.log('✅ Created additional comments')

  // Create Support Tickets
  const supportTickets = []
  const ticketSubjects = [
    'Ödeme işlemi tamamlanmadı',
    'Marketplace ilanım onaylanmadı',
    'Hesap giriş sorunu',
    'Teknik destek gerekiyor',
    'Para çekme işlemi beklemede',
    'İlan görselleri yüklenmiyor',
    'Profil fotoğrafı değişmiyor',
    'Mesajlaşma çalışmıyor',
  ]

  for (let i = 0; i < ticketSubjects.length; i++) {
    const user = users[Math.floor(Math.random() * Math.min(10, users.length))]
    const categories: Array<'PAYMENT' | 'MARKETPLACE' | 'ACCOUNT' | 'TECHNICAL' | 'OTHER'> = [
      'PAYMENT',
      'MARKETPLACE',
      'ACCOUNT',
      'TECHNICAL',
      'OTHER',
    ]
    const category = categories[i % categories.length]
    const priorities: Array<'LOW' | 'MEDIUM' | 'HIGH'> = ['LOW', 'MEDIUM', 'HIGH']
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const statuses: Array<'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'CLOSED'> = [
      'OPEN',
      'IN_PROGRESS',
      'WAITING_USER',
      'CLOSED',
    ]
    const status = i < 2 ? 'OPEN' : i < 4 ? 'IN_PROGRESS' : i < 6 ? 'WAITING_USER' : 'CLOSED'
    
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7))

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: ticketSubjects[i],
        category,
        priority,
        status,
        createdAt,
        lastMessageAt: createdAt,
        messages: {
          create: [
            {
              senderType: 'USER',
              senderId: user.id,
              message: `${ticketSubjects[i]} konusunda yardıma ihtiyacım var. Detaylı bilgi verebilir misiniz?`,
              createdAt,
            },
            ...(status !== 'OPEN' && i % 2 === 0
              ? [
                  {
                    senderType: 'ADMIN' as const,
                    senderId: users[0].id,
                    message: 'Merhaba, sorununuzu inceliyoruz. En kısa sürede size dönüş yapacağız.',
                    createdAt: new Date(createdAt.getTime() + 3600000),
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        messages: true,
      },
    })

    // Update lastMessageAt if there are multiple messages
    if (ticket.messages.length > 1) {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          lastMessageAt: ticket.messages[ticket.messages.length - 1].createdAt,
        },
      })
    }

    supportTickets.push(ticket)
  }

  console.log(`✅ Created ${supportTickets.length} support tickets`)

  console.log('🎉 Seeding completed!')
  console.log('\n📝 Test Credentials:')
  console.log('Admin: admin / password123')
  console.log('Moderator: moderator / password123')
  console.log('User: proplayer / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

