# 🚀 Yerel Kurulum Rehberi

## 1. Gereksinimler

- Node.js 18+ (veya 20+ önerilir)
- PostgreSQL veritabanı
- npm veya yarn

## 2. Bağımlılıkları Yükleme

```bash
npm install
```

## 3. PostgreSQL Veritabanı Oluşturma

### Seçenek A: Yerel PostgreSQL
```bash
# PostgreSQL kuruluysa
createdb standoff2_community
```

### Seçenek B: Docker ile PostgreSQL
```bash
docker run --name standoff2-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=standoff2_community \
  -p 5432:5432 \
  -d postgres:15
```

### Seçenek C: Cloud Servis (Supabase, Railway, vb.)
- Ücretsiz PostgreSQL servisi kullanabilirsiniz
- Connection string'i alın

## 4. Environment Değişkenlerini Ayarlama

`.env` dosyası oluşturun (proje kök dizininde):

```bash
# .env dosyası oluştur
touch .env
```

`.env` dosyasına şunları ekleyin:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/standoff2_community?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Cloudinary (opsiyonel - görsel yükleme için)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# App
NODE_ENV="development"
```

### NextAuth Secret Oluşturma

**Yöntem 1: OpenSSL ile (Önerilen)**
```bash
openssl rand -base64 32
```

**Yöntem 2: Node.js ile**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Yöntem 3: Online Tool**
- https://generate-secret.vercel.app/32 adresini kullanabilirsiniz

Oluşturulan secret'i `.env` dosyasındaki `NEXTAUTH_SECRET` değerine yapıştırın.

## 5. Veritabanını Oluşturma

```bash
# Prisma şemasını veritabanına uygula
npx prisma db push

# Prisma Client'ı generate et
npx prisma generate
```

## 6. İlk Kategori Oluşturma (Opsiyonel)

Prisma Studio ile:

```bash
npx prisma studio
```

Tarayıcıda açılan arayüzden:
1. `Category` tablosuna gidin
2. "Add record" butonuna tıklayın
3. Örnek kategori ekleyin:
   - name: "Genel Tartışma"
   - slug: "genel-tartisma"
   - description: "Genel konular için"
   - order: 0

## 7. Development Server'ı Başlatma

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## 8. İlk Kullanıcı Oluşturma

1. Ana sayfada "Kayıt Ol" butonuna tıklayın
2. Formu doldurun ve kayıt olun
3. Giriş yapın

## 9. Admin Kullanıcı Oluşturma

Prisma Studio ile veya SQL ile:

```sql
-- Prisma Studio'da User tablosuna gidin
-- Kayıt olduğunuz kullanıcıyı bulun
-- role alanını "ADMIN" olarak değiştirin
```

Veya SQL ile:
```sql
UPDATE "users" SET role = 'ADMIN' WHERE username = 'your-username';
```

## 🔧 Sorun Giderme

### Veritabanı bağlantı hatası
- PostgreSQL'in çalıştığından emin olun
- `DATABASE_URL` formatını kontrol edin
- Kullanıcı adı ve şifrenin doğru olduğundan emin olun

### Prisma hatası
```bash
# Prisma Client'ı yeniden generate edin
npx prisma generate

# Veritabanını sıfırlayın (DİKKAT: Tüm veriler silinir)
npx prisma migrate reset
```

### Port 3000 kullanımda
```bash
# Farklı port kullanmak için
PORT=3001 npm run dev
```

## 📝 Notlar

- Development modunda hot reload aktif
- Veritabanı değişiklikleri için `npx prisma db push` kullanın
- Production'da migration kullanın: `npx prisma migrate dev`

