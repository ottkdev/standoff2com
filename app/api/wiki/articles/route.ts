import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

const createWikiArticleSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(100),
  excerpt: z.string().max(500).optional(),
  category: z.enum([
    'SILAHLAR',
    'HARITALAR',
    'OYUN_MODLARI',
    'RUTBELER',
    'GUNCELLEMELER',
    'SKINLER',
    'EKONOMI',
    'TAKTIKLER',
    'SSS',
  ]),
  featuredImage: z.string().url().optional().or(z.literal('')),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  keywords: z.string().optional(),
  relatedArticles: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const data = createWikiArticleSchema.parse(body)

    // Generate slug from title
    const baseSlug = slugify(data.title)
    let slug = baseSlug
    let counter = 1

    // Ensure unique slug
    while (await prisma.wikiArticle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Generate table of contents
    const toc = generateTOC(data.content)

    const article = await prisma.wikiArticle.create({
      data: {
        ...data,
        slug,
        authorId: session.user.id,
        tableOfContents: JSON.stringify(toc),
        relatedArticles: data.relatedArticles ? JSON.stringify(data.relatedArticles) : null,
        publishedAt: data.isPublished ? new Date() : undefined,
      },
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const skip = (page - 1) * limit

    const where: any = {
      isPublished: true,
    }

    if (category) {
      where.category = category.toUpperCase().replace('-', '_')
    }

    const [articles, total] = await Promise.all([
      prisma.wikiArticle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.wikiArticle.count({ where }),
    ])

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 })
  }
}

function generateTOC(content: string): Array<{ id: string; text: string; level: number }> {
  const toc: Array<{ id: string; text: string; level: number }> = []
  const lines = content.split('\n')

  for (const line of lines) {
    if (line.startsWith('## ')) {
      const text = line.replace('## ', '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      toc.push({ id, text, level: 2 })
    } else if (line.startsWith('### ')) {
      const text = line.replace('### ', '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      toc.push({ id, text, level: 3 })
    }
  }

  return toc
}

