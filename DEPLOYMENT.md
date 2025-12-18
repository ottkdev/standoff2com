# 🚀 Vercel Deployment Rehberi

Bu rehber, Standoff 2 Topluluk sitesini Vercel'e deploy etmek için adım adım talimatlar içerir.

## 📋 Ön Gereksinimler

1. **Vercel Hesabı**: [vercel.com](https://vercel.com) üzerinden ücretsiz hesap oluşturun
2. **GitHub/GitLab/Bitbucket Repository**: Projeniz bir Git repository'de olmalı
3. **PostgreSQL Veritabanı**: Production için bir PostgreSQL veritabanı gereklidir

## 🗄️ Veritabanı Kurulumu

### Seçenek 1: Vercel Postgres (Önerilen)
1. Vercel Dashboard'a gidin
2. Projenizi oluşturduktan sonra **Storage** sekmesine gidin
3. **Create Database** → **Postgres** seçin
4. Veritabanını oluşturun ve connection string'i kopyalayın

### Seçenek 2: Supabase (Ücretsiz)
1. [supabase.com](https://supabase.com) üzerinden hesap oluşturun
2. Yeni proje oluşturun
3. **Settings** → **Database** → **Connection string** (URI) kopyalayın

### Seçenek 3: Railway / Neon / PlanetScale
- Railway: [railway.app](https://railway.app)
- Neon: [neon.tech](https://neon.tech)
- Herhangi bir PostgreSQL sağlayıcısı kullanabilirsiniz

## 🔧 Vercel'e Deploy Etme

### Adım 1: Projeyi GitHub'a Push Edin

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/standoff2-community.git
git push -u origin main
```

### Adım 2: Vercel'de Proje Oluşturun

1. [vercel.com/new](https://vercel.com/new) adresine gidin
2. GitHub hesabınızı bağlayın
3. Repository'nizi seçin
4. **Import** butonuna tıklayın

### Adım 3: Build Ayarları

Vercel otomatik olarak Next.js projelerini algılar, ancak şu ayarları kontrol edin:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (otomatik)
- **Output Directory**: `.next` (otomatik)
- **Install Command**: `npm install` (otomatik)

### Adım 4: Environment Variables

Vercel Dashboard'da **Settings** → **Environment Variables** bölümüne gidin ve şu değişkenleri ekleyin:

#### Zorunlu Değişkenler:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NODE_ENV=production
```

#### Opsiyonel Değişkenler (Cloudinary için):

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### NEXTAUTH_SECRET Oluşturma:

```bash
# Terminal'de çalıştırın:
openssl rand -base64 32
```

Veya online tool kullanın: https://generate-secret.vercel.app/32

### Adım 5: İlk Deploy

1. **Deploy** butonuna tıklayın
2. Build işlemi başlayacak (2-5 dakika sürebilir)
3. Deploy tamamlandığında URL'nizi alacaksınız

## 🗄️ Veritabanı Migration

### Production'da İlk Kurulum

Deploy sonrası veritabanını hazırlamak için:

1. **Vercel CLI** ile bağlanın (veya Vercel Dashboard'dan terminal açın):

```bash
npm i -g vercel
vercel login
vercel link
```

2. **Prisma Migration** çalıştırın:

```bash
# Production database'e bağlan
npx prisma migrate deploy
```

Veya Vercel Dashboard'dan **Deployments** → **Functions** → Terminal açıp:

```bash
npx prisma db push
npx prisma generate
```

### Seed Data (İlk Kurulum)

İlk kullanıcıları ve örnek verileri eklemek için:

```bash
npm run db:seed
```

**Not**: Production'da seed script'i çalıştırmadan önce dikkatli olun!

## 🔐 İlk Admin Kullanıcı Oluşturma

### Yöntem 1: Prisma Studio (Önerilen)

1. Vercel Dashboard'dan terminal açın
2. Şu komutu çalıştırın:

```bash
npx prisma studio
```

3. Tarayıcıda açılan arayüzden:
   - `User` tablosuna gidin
   - Yeni kullanıcı oluşturun veya mevcut kullanıcıyı düzenleyin
   - `role` alanını `ADMIN` yapın

### Yöntem 2: SQL ile

Veritabanı sağlayıcınızın SQL editor'ünü kullanın:

```sql
UPDATE "users" SET role = 'ADMIN' WHERE username = 'your-username';
```

## ✅ Deploy Sonrası Kontroller

1. **Site Açılıyor mu?**: Ana sayfayı kontrol edin
2. **Giriş Yapılabiliyor mu?**: Login sayfasını test edin
3. **Admin Paneli Erişilebilir mi?**: `/admin` sayfasını kontrol edin
4. **Veritabanı Bağlantısı**: Herhangi bir sayfayı açtığınızda hata olmamalı

## 🔄 Sürekli Deploy (CI/CD)

Vercel otomatik olarak:
- Her `git push` sonrası yeni deploy yapar
- Pull Request'ler için preview deployment oluşturur
- Production ve Preview environment'ları ayrı tutar

### Branch Stratejisi

- `main` branch → Production
- Diğer branch'ler → Preview deployments

## 🛠️ Sorun Giderme

### Build Hatası

```bash
# Lokal'de test edin:
npm run build
```

### Veritabanı Bağlantı Hatası

1. `DATABASE_URL` environment variable'ını kontrol edin
2. Veritabanı sağlayıcınızın IP whitelist'ine Vercel IP'lerini ekleyin
3. SSL connection string kullanın (production için zorunlu)

### NextAuth Hatası

1. `NEXTAUTH_URL` production URL'nize ayarlı olmalı
2. `NEXTAUTH_SECRET` güçlü bir secret olmalı
3. Callback URL'leri kontrol edin

### Image Upload Hatası

Cloudinary kullanıyorsanız:
1. Environment variables'ı kontrol edin
2. Cloudinary dashboard'dan API key'leri doğrulayın

## 📊 Monitoring

Vercel Dashboard'da:
- **Analytics**: Trafik ve performans metrikleri
- **Logs**: Server ve function logları
- **Deployments**: Deploy geçmişi

## 🔒 Güvenlik Kontrolleri

- [ ] `NEXTAUTH_SECRET` güçlü ve unique
- [ ] `DATABASE_URL` production'da doğru
- [ ] Environment variables production'da ayarlı
- [ ] Admin kullanıcı oluşturuldu
- [ ] HTTPS aktif (Vercel otomatik sağlar)

## 📝 Önemli Notlar

1. **Free Tier Limitleri**:
   - 100GB bandwidth/ay
   - 100 build/ay
   - Serverless function execution time limitleri

2. **Database Connection Pooling**:
   - Production'da connection pooling kullanın
   - Prisma için `pgBouncer` veya `Prisma Data Proxy` önerilir

3. **Environment Variables**:
   - Production ve Preview için ayrı ayrı ayarlayabilirsiniz
   - Sensitive data için Vercel Secrets kullanın

## 🎉 Başarılı Deploy!

Site artık canlıda! 🚀

- **Production URL**: `https://your-project.vercel.app`
- **Custom Domain**: Vercel Dashboard'dan ekleyebilirsiniz

## 📚 Ek Kaynaklar

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

