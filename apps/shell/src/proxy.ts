import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@repo/shared/auth'

// AUTH-04: redirects unauthenticated requests away from protected routes
// (Home "/", Transações "/transactions") to /login. /login, /register, and
// /api/auth/* must stay reachable without a session cookie — otherwise an
// unauthenticated user could never reach the login form.
//
// Next 16 renamed middleware.ts -> proxy.ts (design.md "Risks & Concerns").
// proxy reads cookies via request.cookies directly — the async cookies()
// helper from next/headers (used by packages/shared/auth.ts's
// getSessionToken) is scoped to Route Handlers/Server Components, not proxy.
const PUBLIC_PATHS = ['/login', '/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/auth')
  if (isPublic) return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
