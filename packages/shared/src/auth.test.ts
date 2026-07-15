import { NextResponse } from 'next/server'
import { describe, expect, it, vi } from 'vitest'

// getSessionToken relies on next/headers `cookies()`, which is only wired up
// inside a real Next.js request scope. We mock it here (a minimal Route
// Handler harness) to exercise our own read logic in isolation.
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'

import { SESSION_COOKIE_NAME, clearSessionCookie, getSessionToken, setSessionCookie } from './auth'

describe('getSessionToken', () => {
  it('returns the token when the session cookie is present', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        name === SESSION_COOKIE_NAME ? { name, value: 'token-123' } : undefined,
    } as never)

    await expect(getSessionToken()).resolves.toBe('token-123')
  })

  it('returns null when the session cookie is absent', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as never)

    await expect(getSessionToken()).resolves.toBeNull()
  })
})

describe('setSessionCookie / clearSessionCookie (Route Handler response harness)', () => {
  it('sets the cookie with httpOnly, secure, and sameSite=lax flags', () => {
    const response = new NextResponse()

    setSessionCookie(response, 'token-123')

    const setCookieHeader = response.headers.get('set-cookie')
    expect(setCookieHeader).toContain('bytebank_session=token-123')
    expect(setCookieHeader).toContain('HttpOnly')
    expect(setCookieHeader).toContain('Secure')
    expect(setCookieHeader).toMatch(/SameSite=lax/i)
  })

  it('round-trips set -> read via response.cookies', () => {
    const response = new NextResponse()

    setSessionCookie(response, 'token-123')

    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('token-123')
  })

  it('round-trips set -> clear, removing the token value', () => {
    const response = new NextResponse()

    setSessionCookie(response, 'token-123')
    clearSessionCookie(response)

    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('')
  })
})
