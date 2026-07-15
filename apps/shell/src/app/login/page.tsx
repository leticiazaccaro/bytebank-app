'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { submitLogin, type LoginValues } from './submitLogin'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: LoginValues) {
    setSubmitting(true)
    setError(null)

    const result = await submitLogin(values)

    if (result.ok) {
      // "/" is a different Multi-Zones app (mf-dashboard) — a soft
      // client-side push would 404 inside the shell zone's own router, so
      // this must be a real browser navigation (design.md AD-001).
      window.location.href = '/'
      return
    }

    setError(result.message)
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <h1 className="text-2xl font-semibold text-neutral-800">Entrar no ByteBank</h1>
      <LoginForm onSubmit={handleSubmit} error={error} submitting={submitting} />
      <Link href="/register" className="text-sm text-primary hover:underline">
        Ainda não tem conta? Cadastre-se
      </Link>
    </div>
  )
}
