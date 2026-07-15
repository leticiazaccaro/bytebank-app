export interface LoginValues {
  email: string
  password: string
}

export type LoginResult = { ok: true } | { ok: false; message: string }

const GENERIC_ERROR = 'Não foi possível fazer login. Tente novamente.'

// Pure, dependency-injectable submit logic for the login form (AUTH-02).
// Kept separate from LoginForm/page.tsx so the branching (success / inline
// API error / network failure) is unit-testable without rendering React.
export async function submitLogin(
  values: LoginValues,
  fetchImpl: typeof fetch = fetch
): Promise<LoginResult> {
  try {
    const response = await fetchImpl('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (response.ok) return { ok: true }

    const body = (await response.json().catch(() => null)) as { message?: unknown } | null
    return {
      ok: false,
      message: typeof body?.message === 'string' ? body.message : GENERIC_ERROR,
    }
  } catch {
    return { ok: false, message: GENERIC_ERROR }
  }
}
