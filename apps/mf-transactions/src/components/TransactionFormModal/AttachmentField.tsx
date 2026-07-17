'use client'

import { useId, useState, type ChangeEvent } from 'react'

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
  const inputId = useId()

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
      <span className="text-sm font-medium text-neutral-700">Anexo (opcional)</span>

      <div className="flex items-center gap-3">
        {/* Native file inputs render as unstyled browser chrome (just plain
            text in most browsers) — a visually hidden input paired with a
            button-styled label makes it read as clickable and keeps native
            keyboard/file-picker behavior intact (clicking/activating the
            label proxies to the input via htmlFor). */}
        <label
          htmlFor={inputId}
          className={[
            'inline-flex items-center gap-2 rounded-md border font-medium text-sm cursor-pointer',
            'px-4 py-2 transition-colors duration-150 shrink-0',
            'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
            error
              ? 'border-danger text-danger hover:bg-danger/5'
              : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100',
          ].join(' ')}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Escolher arquivo
          <input
            id={inputId}
            type="file"
            accept={ALLOWED_ATTACHMENT_TYPES.join(',')}
            onChange={handleFileChange}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="sr-only"
          />
        </label>

        {value && !error && (
          <span className="text-sm text-neutral-600 truncate">{value.anexo}</span>
        )}
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-danger"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
