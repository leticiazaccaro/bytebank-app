import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'

// Next 16 renamed middleware.ts -> proxy.ts and made cookies()/headers() fully
// async — see design.md "Risks & Concerns". Always `await cookies()` here.
export const SESSION_COOKIE_NAME = 'bytebank_session'

/**
 * Reads the session JWT from the httpOnly cookie. Server-only — usable from
 * Route Handlers and Server Components (uses next/headers `cookies()`).
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

/**
 * Sets the session cookie on a Route Handler response as httpOnly/secure,
 * per design.md AD-003 (JWT never exposed to client-side JS).
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })
}

/** Clears the session cookie (logout). */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME)
}
