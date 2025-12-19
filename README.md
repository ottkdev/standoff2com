# Standoff 2 Topluluk Web Sitesi

Modern, hızlı ve ölçeklenebilir topluluk web sitesi.

## 🚀 Özellikler

- ✅ Kullanıcı sistemi (kayıt, giriş, profil, takip)
- ✅ Forum sistemi (kategori, konu, yorum, beğeni)
- ✅ Blog/Haber/Duyuru sistemi
- ✅ Direct Message (DM) sistemi
- ✅ Alım/Satım (Marketplace) bölümü
- ✅ Admin paneli
- ✅ Rol tabanlı yetkilendirme
- ✅ Rozet ve verified kullanıcı sistemi

## 🛠️ Teknolojiler

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Image Upload**: Cloudinary
- **Realtime**: WebSocket (Socket.io)

## 📦 Kurulum

### ⚡ Hızlı Başlangıç
Detaylı kurulum için **[QUICK_START.md](./QUICK_START.md)** dosyasına bakın.

### 📋 Kısa Özet

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **.env dosyası oluşturun:**
```bash
# .env.example dosyasını .env olarak kopyalayın
cp .env.example .env
```

**Önemli:** `.env` dosyasını düzenleyip aşağıdaki değerleri ekleyin:
- `DATABASE_URL`: PostgreSQL veritabanı bağlantı string'i
- `NEXTAUTH_SECRET`: NextAuth için secret (oluşturmak için: `openssl rand -base64 32`)
- `NEXT_PUBLIC_SITE_URL`: Site URL'iniz (production'da: `https://yourdomain.com`)
- `CLOUDINARY_*`: Cloudinary API bilgileri (image upload için)
- `PAYTR_*`: PayTR ödeme gateway bilgileri (wallet sistemi için)

**PayTR Yapılandırması:**
1. [PayTR](https://www.paytr.com) hesabı oluşturun
2. Panel → Ayarlar → API Bilgileri bölümünden:
   - `PAYTR_MERCHANT_ID`: Mağaza numaranız
   - `PAYTR_MERCHANT_KEY`: API anahtarınız
   - `PAYTR_MERCHANT_SALT`: Güvenlik anahtarınız
3. Bu değerleri `.env` dosyasına ekleyin

3. **Veritabanını hazırlayın ve oluşturun:**
```bash
npx prisma db push
npx prisma generate
```

4. **Development server'ı başlatın:**
```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

> 💡 **Detaylı kurulum:** [SETUP.md](./SETUP.md)  
> ⚡ **Hızlı başlangıç:** [QUICK_START.md](./QUICK_START.md)

## 📁 Proje Yapısı

Detaylı mimari için `ARCHITECTURE.md` dosyasına bakın.

## 🔐 Örnek Veriler (Seed)

Siteyi örnek verilerle doldurmak için:

```bash
npm run db:seed
```

Bu komut şunları oluşturur:
- 6 örnek kullanıcı (admin, moderator, vb.)
- Forum kategorileri ve konular
- Blog yazıları
- Marketplace ilanları
- Rozetler

**Test Kullanıcıları:**
- Admin: `admin` / `password123`
- Moderator: `moderator` / `password123`
- User: `proplayer` / `password123`

> 📖 **Detaylı bilgi:** [SEED_INSTRUCTIONS.md](./SEED_INSTRUCTIONS.md)

## 🚀 Production Deployment

Siteyi Vercel'e deploy etmek için detaylı rehber:

**[DEPLOYMENT.md](./DEPLOYMENT.md)** dosyasına bakın.

### Hızlı Özet:
1. Projeyi GitHub'a push edin
2. Vercel'de yeni proje oluşturun
3. Environment variables'ı ayarlayın
4. Deploy edin!

## 📝 Notlar

- Production'da mutlaka `NEXTAUTH_SECRET` değerini değiştirin
- Database migration'ları production'da dikkatli kullanın
- Image upload için Cloudinary hesabı gereklidir
- Production build başarıyla çalışıyor ✅

## ✅ Production Hazır

Site production'a deploy edilmeye hazır! Tüm build hataları düzeltildi ve gereksiz dosyalar temizlendi.

