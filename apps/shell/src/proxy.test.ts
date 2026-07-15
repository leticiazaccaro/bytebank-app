import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { proxy } from './proxy'

function requestFor(path: string, cookie?: string): NextRequest {
  const headers = cookie ? { cookie } : undefined
  return new NextRequest(new URL(path, 'http://localhost:3000'), { headers })
}

describe('proxy', () => {
  it('redirects an unauthenticated request to Home ("/") to /login (AUTH-04)', () => {
    const response = proxy(requestFor('/'))

    expect(response.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('redirects an unauthenticated request to /transactions to /login (AUTH-04)', () => {
    const response = proxy(requestFor('/transactions'))

    expect(response.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('lets an authenticated request to a protected route through without redirecting', () => {
    const response = proxy(requestFor('/', 'bytebank_session=jwt-abc'))

    expect(response.headers.get('location')).toBeNull()
  })

  it('does not redirect an unauthenticated request to /login (prevents a redirect loop)', () => {
    const response = proxy(requestFor('/login'))

    expect(response.headers.get('location')).toBeNull()
  })

  it('does not redirect an unauthenticated request to /api/auth/login (the login call itself must stay reachable)', () => {
    const response = proxy(requestFor('/api/auth/login'))

    expect(response.headers.get('location')).toBeNull()
  })
})
