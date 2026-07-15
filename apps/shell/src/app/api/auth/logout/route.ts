import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@repo/shared/auth'

// AUTH-06: the real API has no session/logout endpoint to call (spec.md Out
// of Scope — no refresh token support) — logout only clears the local
// httpOnly session cookie set at login (design.md AD-003).
export async function POST() {
  const response = NextResponse.json({ message: 'Logout realizado com sucesso.' }, { status: 200 })
  clearSessionCookie(response)
  return response
}
