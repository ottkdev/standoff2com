# Verileri Geri Yükleme Rehberi

Migration sonrası verileri geri yüklemek için aşağıdaki adımları izleyin:

## ⚠️ ÖNEMLİ: Development Server'ı Durdurun

Eğer `npm run dev` çalışıyorsa, önce durdurun (Ctrl+C).

## Adım 1: Prisma Client'ı Generate Edin

```bash
npx prisma generate
```

## Adım 2: Veritabanını Seed Edin

```bash
npm run db:seed
```

veya

```bash
npx tsx prisma/seed.ts
```

## ✅ Seed Dosyası Şunları Oluşturur:

- **41 Kullanıcı** (admin, moderator, proplayer, newbie, trader, content_creator + 35 fake user)
- **4 Rozet** (Aktif Üye, Topluluk Lideri, Güvenilir Satıcı, Yardımsever)
- **7 Kategori** (Forum ve Blog kategorileri)
- **65+ Forum Konusu** (pinned'ler dahil)
- **200+ Yorum**
- **5 Blog Yazısı**
- **6 Marketplace İlanı**
- **12 Wiki Makalesi**
- **8 Destek Talebi** (farklı durumlarda)

## 🔑 Test Hesapları:

- **Admin:** `admin` / `password123`
- **Moderator:** `moderator` / `password123`
- **Kullanıcı:** `proplayer` / `password123`

## 📝 Notlar:

- Seed dosyası mevcut verileri **SİLER** ve yenilerini oluşturur
- Production'da seed kullanmayın!
- Tüm şifreler: `password123`

## Sorun Giderme:

Eğer `prisma generate` hatası alırsanız:
1. Development server'ı durdurun
2. `node_modules/.prisma` klasörünü silin (opsiyonel)
3. Tekrar `npx prisma generate` çalıştırın

