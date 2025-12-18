import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { loginSchema } from './validations/user.validation'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Kullanıcı adı ve şifre gereklidir')
        }

        // Validate input
        const validated = loginSchema.safeParse({
          username: credentials.username,
          password: credentials.password,
        })

        if (!validated.success) {
          throw new Error('Geçersiz giriş bilgileri')
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user) {
          throw new Error('Kullanıcı bulunamadı')
        }

        // Check if banned
        if (user.isBanned) {
          if (user.bannedUntil && user.bannedUntil > new Date()) {
            throw new Error('Hesabınız geçici olarak yasaklanmıştır')
          } else if (!user.bannedUntil) {
            throw new Error('Hesabınız kalıcı olarak yasaklanmıştır')
          }
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Hatalı şifre')
        }

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.isVerified = user.isVerified
      }
      // Always fetch latest user data from database to ensure role is up-to-date
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isVerified: true, isBanned: true },
        })
        if (!dbUser || dbUser.isBanned) {
          // User doesn't exist or is banned, mark token as invalid
          // Don't return null, instead mark it and let session callback handle it
          return { ...token, invalid: true } as any
        }
        token.role = dbUser.role
        token.isVerified = dbUser.isVerified
      }
      return token
    },
    async session({ session, token }) {
      // If token is null, invalid, or marked as invalid, return empty session
      if (!token || !token.id || (token as any).invalid) {
        return { ...session, user: undefined }
      }

      // Verify user still exists in database
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { id: true, role: true, isVerified: true, isBanned: true },
      })
      
      // If user doesn't exist or is banned, invalidate session
      if (!dbUser || dbUser.isBanned) {
        return { ...session, user: undefined }
      }
      
      // Set session user data
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = dbUser.role
        session.user.isVerified = dbUser.isVerified
      }
      
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

