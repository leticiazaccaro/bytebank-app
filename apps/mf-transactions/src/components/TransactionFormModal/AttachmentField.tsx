'use client'

import { useState, type ChangeEvent } from 'react'

// FORM-05: only these types and a 2MB limit are accepted.
export const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024
export const ALLOWED_ATTACHMENT_TYPES = ['image/png', 'image/jpeg', 'application/pdf']

/**
 * FORM-05: validated before any attempt to read the file — an invalid file
 * is rejected with an inline error message, without touching the rest of
 * the form's state.
 */
export function validateAttachment(file: File): string | null {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return 'Tipo de arquivo não suportado. Envie um PNG, JPEG ou PDF.'
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return 'Arquivo muito grande. O limite é 2MB.'
  }
  return null
}

/**
 * FORM-06: converts a validated file into a Base64 Data URL. Rejects
 * (instead of throwing) on a `FileReader` read error — e.g. a corrupted or
 * unreadable file (spec.md Edge Case) — so the caller can surface it
 * without crashing the form.
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Não foi possível ler o arquivo selecionado.'))
      }
    }
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'))
    reader.readAsDataURL(file)
  })
}

export interface AttachmentPayload {
  anexo: string
  urlAnexo: string
}

interface AttachmentFieldProps {
  value?: AttachmentPayload
  onChange: (payload: AttachmentPayload | undefined) => void
}

export function AttachmentField({ value, onChange }: AttachmentFieldProps) {
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Allows re-selecting the same file after clearing an error.
    event.target.value = ''
    if (!file) return

    const validationError = validateAttachment(file)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      const urlAnexo = await readFileAsDataURL(file)
      setError(null)
      onChange({ anexo: file.name, urlAnexo })
    } catch {
      setError('Não foi possível ler o arquivo selecionado.')
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="transaction-attachment" className="text-sm font-medium text-neutral-700">
        Anexo (opcional)
      </label>
      <input
        id="transaction-attachment"
        type="file"
        accept={ALLOWED_ATTACHMENT_TYPES.join(',')}
        onChange={handleFileChange}
        className="text-sm text-neutral-600"
      />
      {value && <p className="text-xs text-neutral-500">{value.anexo}</p>}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}
