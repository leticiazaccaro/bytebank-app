'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RegisterForm } from './RegisterForm'
import { submitRegister, type RegisterValues } from './submitRegister'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: RegisterValues) {
    setSubmitting(true)
    setError(null)

    const result = await submitRegister(values)

    if (result.ok) {
      // /login lives in the same zone (shell) — a soft, client-side
      // navigation is enough (design.md AD-001).
      router.push('/login')
      return
    }

    setError(result.message)
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <h1 className="text-2xl font-semibold text-neutral-800">Criar conta no ByteBank</h1>
      <RegisterForm onSubmit={handleSubmit} error={error} submitting={submitting} />
      <Link href="/login" className="text-sm text-primary hover:underline">
        Já tem conta? Entrar
      </Link>
    </div>
  )
}
