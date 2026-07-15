import { describe, expect, it } from 'vitest'

import { SESSION_COOKIE_NAME } from '@repo/shared/auth'

import { POST } from './route'

describe('POST /api/auth/logout', () => {
  it('clears the session cookie from the response (AUTH-06)', async () => {
    const response = await POST()

    expect(response.status).toBe(200)
    // clearSessionCookie deletes the cookie by emptying its value on the
    // response — confirm it's gone rather than just that some Set-Cookie
    // header exists.
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('')

    const setCookieHeader = response.headers.get('set-cookie')
    expect(setCookieHeader).toContain(`${SESSION_COOKIE_NAME}=`)
    expect(setCookieHeader).not.toContain(`${SESSION_COOKIE_NAME}=some-real-token`)
  })
})
