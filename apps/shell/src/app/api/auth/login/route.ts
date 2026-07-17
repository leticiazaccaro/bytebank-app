import { NextResponse } from 'next/server'
import { ApiClientError, login } from '@repo/shared/apiClient'
import { setSessionCookie } from '@repo/shared/auth'

// AUTH-02/AUTH-03: proxies POST /user/auth on the real API. On success, the
// JWT never reaches client-side JS — it's stored in an httpOnly cookie
// (design.md AD-003). The real API's /user/auth response carries only a
// token, no user object, and the client only ever checks `response.ok`
// (submitLogin.ts) — so the success body is just an acknowledgement. On
// failure, the client-facing message is always the same generic text
// regardless of whether the email or the password was wrong: relaying the
// API's raw distinction would let an attacker enumerate registered emails,
// which is exactly the "internal detail" AUTH-03 says not to expose. No
// cookie is ever set on a failed login.
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const { token } = await login(email, password)
    const response = NextResponse.json({ ok: true }, { status: 200 })
    setSessionCookie(response, token)
    return response
  } catch (error) {
    if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
      return NextResponse.json({ message: 'E-mail ou senha inválidos.' }, { status: 401 })
    }
    return NextResponse.json(
      { message: 'Não foi possível fazer login. Tente novamente.' },
      { status: 502 }
    )
  }
}
