import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site adı gereklidir'),
  siteDescription: z.string().optional(),
  logoUrl: z.union([z.string().url('Geçerli bir URL giriniz'), z.literal('')]).optional(),
  footerText: z.string().optional(),
  registrationOpen: z.boolean(),
  guestViewing: z.boolean(),
  emailFromName: z.string().optional(),
  emailFromEmail: z.union([z.string().email('Geçerli bir e-posta adresi giriniz'), z.literal('')]).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'site-settings' },
    })

    // İlk kez çalışıyorsa default değerlerle oluştur
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 'site-settings',
          siteName: 'Standoff 2 Topluluk',
          siteDescription: 'Standoff 2 oyuncuları için modern topluluk platformu',
          registrationOpen: true,
          guestViewing: true,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = updateSettingsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const updateData: any = {
      siteName: validation.data.siteName,
      siteDescription: validation.data.siteDescription || null,
      logoUrl: validation.data.logoUrl || null,
      footerText: validation.data.footerText || null,
      registrationOpen: validation.data.registrationOpen,
      guestViewing: validation.data.guestViewing,
      emailFromName: validation.data.emailFromName || null,
      emailFromEmail: validation.data.emailFromEmail || null,
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: 'site-settings' },
      update: updateData,
      create: {
        id: 'site-settings',
        ...updateData,
      },
    })

    return NextResponse.json(settings)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
