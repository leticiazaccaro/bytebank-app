import { NextResponse } from 'next/server'
import { ApiClientError, createTransaction, fetchStatement } from '@repo/shared/apiClient'
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
      { message: 'Não foi possível carregar as transações. Tente novamente.' },
      { status: 502 }
    )
  }
}

// API-02: proxies POST /account/transaction. A 4xx from the real API (e.g. a
// missing/invalid field) carries a user-facing `message` that's safe to
// relay verbatim — same "validation-error passthrough" pattern as the
// shell's register Route Handler — while anything else (5xx, network
// failure) collapses into one generic message.
export async function POST(request: Request) {
  const token = await getSessionToken()

  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const created = await createTransaction(token, body)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
    }
    if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    return NextResponse.json(
      { message: 'Não foi possível criar a transação. Tente novamente.' },
      { status: 502 }
    )
  }
}
