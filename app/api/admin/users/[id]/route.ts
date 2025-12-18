import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role, isVerified } = body

    const updateData: any = {}
    if (role && ['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
      updateData.role = role as UserRole
    }
    if (typeof isVerified === 'boolean') {
      updateData.isVerified = isVerified
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

