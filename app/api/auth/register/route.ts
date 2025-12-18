import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { registerSchema } from '@/lib/validations/user.validation'
import { slugify } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { username, email, password, displayName } = validation.data

    // Check if username exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.username === username ? 'Bu kullanıcı adı zaten kullanılıyor' : 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        displayName: displayName || username,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { message: 'Kullanıcı başarıyla oluşturuldu', user },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

