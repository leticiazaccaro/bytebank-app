import { NextResponse } from 'next/server'
import { ApiClientError, fetchStatement } from '@repo/shared/apiClient'
import { getSessionToken } from '@repo/shared/auth'

// API-01: reads the session cookie directly (this zone is same-origin from
// the browser's perspective, via the shell's server-side rewrite — see
// design.md Architecture Overview) and proxies to the real API's statement
// endpoint. Never exposes the upstream error body to the client.
export async function GET() {
  const token = await getSessionToken()

  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 })
  }

  try {
    const transactions = await fetchStatement(token)
    return NextResponse.json(transactions, { status: 200 })
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
    }
    return NextResponse.json(
      { message: 'Não foi possível carregar o extrato. Tente novamente.' },
      { status: 502 }
    )
  }
}
