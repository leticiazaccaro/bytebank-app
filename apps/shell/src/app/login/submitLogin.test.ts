import { describe, expect, it, vi } from 'vitest'

import { submitLogin } from './submitLogin'

function jsonResponse(ok: boolean, body: unknown): Response {
  return { ok, json: vi.fn().mockResolvedValue(body) } as unknown as Response
}

describe('submitLogin', () => {
  it('resolves { ok: true } when the login Route Handler responds successfully', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(true, { id: 'u1' }))

    const result = await submitLogin({ email: 'ana@example.com', password: 'secret' }, fetchImpl)

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'ana@example.com', password: 'secret' }),
      })
    )
    expect(result).toEqual({ ok: true })
  })

  it('resolves the API-provided message when the login Route Handler rejects the credentials (AUTH-03)', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(false, { message: 'E-mail ou senha inválidos.' }))

    const result = await submitLogin({ email: 'ana@example.com', password: 'wrong' }, fetchImpl)

    expect(result).toEqual({ ok: false, message: 'E-mail ou senha inválidos.' })
  })

  it('falls back to a generic message on a network failure', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))

    const result = await submitLogin({ email: 'ana@example.com', password: 'secret' }, fetchImpl)

    expect(result).toEqual({
      ok: false,
      message: 'Não foi possível fazer login. Tente novamente.',
    })
  })
})
