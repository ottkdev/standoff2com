import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

    // Admin routes require ADMIN role
    if (isAdminRoute && token?.role !== 'ADMIN' && token?.role !== 'MODERATOR') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes that don't require auth
        const publicRoutes = ['/', '/forum', '/blog', '/marketplace', '/profile']
        const isPublicRoute = publicRoutes.some(route => 
          req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/')
        )

        if (isPublicRoute) {
          return true
        }

        // Auth routes (login, register) - redirect if already logged in
        if (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')) {
          return !token // Allow if not logged in
        }

        // Protected routes require token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/messages/:path*',
    '/marketplace/create/:path*',
    '/profile/edit/:path*',
  ],
}

