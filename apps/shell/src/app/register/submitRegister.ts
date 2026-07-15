export interface RegisterValues {
  username: string
  email: string
  password: string
}

export type RegisterResult = { ok: true } | { ok: false; message: string }

const GENERIC_ERROR = 'Não foi possível concluir o cadastro. Tente novamente.'

// Pure, dependency-injectable submit logic for the register form (AUTH-01).
// Kept separate from RegisterForm/page.tsx so the branching (success /
// inline API error / network failure) is unit-testable without rendering
// React.
export async function submitRegister(
  values: RegisterValues,
  fetchImpl: typeof fetch = fetch
): Promise<RegisterResult> {
  try {
    const response = await fetchImpl('/api/auth/register', {
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
