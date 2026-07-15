import { describe, expect, it, vi } from 'vitest'

import { submitRegister } from './submitRegister'

function jsonResponse(ok: boolean, body: unknown): Response {
  return { ok, json: vi.fn().mockResolvedValue(body) } as unknown as Response
}

describe('submitRegister', () => {
  it('resolves { ok: true } when the register Route Handler responds successfully', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(true, { id: 'u1' }))

    const result = await submitRegister(
      { username: 'ana', email: 'ana@example.com', password: 'secret' },
      fetchImpl
    )

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'ana', email: 'ana@example.com', password: 'secret' }),
      })
    )
    expect(result).toEqual({ ok: true })
  })

  it('resolves the API-provided message on a duplicate-email/validation error', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(false, { message: 'email already in use' }))

    const result = await submitRegister(
      { username: 'ana', email: 'dup@example.com', password: 'secret' },
      fetchImpl
    )

    expect(result).toEqual({ ok: false, message: 'email already in use' })
  })

  it('falls back to a generic message on a network failure', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))

    const result = await submitRegister(
      { username: 'ana', email: 'ana@example.com', password: 'secret' },
      fetchImpl
    )

    expect(result).toEqual({
      ok: false,
      message: 'Não foi possível concluir o cadastro. Tente novamente.',
    })
  })
})
