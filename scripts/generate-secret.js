// NextAuth Secret oluşturma script'i
// Kullanım: node scripts/generate-secret.js

const crypto = require('crypto')

const secret = crypto.randomBytes(32).toString('base64')

console.log('\n✅ NextAuth Secret oluşturuldu:\n')
console.log(secret)
console.log('\nBu değeri .env dosyasındaki NEXTAUTH_SECRET değişkenine ekleyin.\n')

