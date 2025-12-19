/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.mm.bing.net',
      },
      {
        protocol: 'https',
        hostname: '*.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'tse1.mm.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'tse2.mm.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'tse3.mm.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'tse4.mm.bing.net',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip static generation for client-only pages
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig

