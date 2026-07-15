import { NextResponse } from 'next/server'
import { ApiClientError, register } from '@repo/shared/apiClient'

// AUTH-01: proxies POST /user on the real tech-challenge-2 API. Errors are
// normalized so the client never sees raw upstream details (AUTH-03
// pattern): a 4xx from the real API carries a user-facing `message` (e.g.
// "email already in use") that's safe to relay verbatim; anything else
// (5xx, network failure) collapses into one generic message, per
// design.md's Error Handling Strategy ("API externa fora do ar").
export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()
    const user = await register({ username, email, password })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    return NextResponse.json(
      { message: 'Não foi possível concluir o cadastro. Tente novamente.' },
      { status: 502 }
    )
  }
}
