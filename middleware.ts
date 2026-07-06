import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PRODUCTION_URL = 'https://persongrown.xyz'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Allow localhost
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return NextResponse.next()
  }

  // Redirect any /login, /register, /forgot, /auth/* to home
  if (
    pathname === '/login' ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot') ||
    pathname.startsWith('/auth/')
  ) {
    return NextResponse.redirect(new URL('/', request.url), 301)
  }

  // Redirect vercel.app preview URLs to production
  if (host.includes('vercel.app')) {
    const newUrl = new URL(request.url)
    newUrl.hostname = 'persongrown.xyz'
    newUrl.protocol = 'https'
    return NextResponse.redirect(newUrl.toString(), 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
}
