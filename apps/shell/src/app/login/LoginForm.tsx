'use client'

import { FormEvent, useState } from 'react'
import { Button } from '@repo/ui/Button/Button'
import { Card } from '@repo/ui/Card/Card'
import { Input } from '@repo/ui/Input/Input'
import type { LoginValues } from './submitLogin'

interface LoginFormProps {
  onSubmit: (values: LoginValues) => void
  error?: string | null
  submitting?: boolean
}

export function LoginForm({ onSubmit, error = null, submitting = false }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email || !password) {
      setFieldError('Preencha e-mail e senha para continuar.')
      return
    }
    setFieldError(null)
    onSubmit({ email, password })
  }

  const displayedError = fieldError ?? error

  return (
    <Card className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {displayedError && (
          <p role="alert" className="text-sm font-medium text-danger">
            {displayedError}
          </p>
        )}
        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </Card>
  )
}
