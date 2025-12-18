import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blockerId = session.user.id
  const blockedId = params.id

  if (!blockedId) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 })
  }

  if (blockerId === blockedId) {
    return NextResponse.json({ error: 'Kendinizi engelleyemezsiniz' }, { status: 400 })
  }

  await prisma.block.upsert({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
    update: {},
    create: {
      blockerId,
      blockedId,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blockerId = session.user.id
  const blockedId = params.id

  if (!blockedId) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 })
  }

  await prisma.block
    .delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    })
    .catch(() => {})

  return NextResponse.json({ ok: true })
}

